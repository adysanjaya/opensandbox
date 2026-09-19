export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: string;
}

export interface ExecutionContext {
  endpointId: string;
  request: {
    method: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: any;
    path: string;
  };
  variables: Record<string, any>;
}

export interface ExecutionResult {
  statusCode: number;
  contentType: 'text/plain' | 'application/json' | 'application/xml';
  body: string;
  headers?: Record<string, string>;
}

export interface ProcessResult {
  action: 'continue' | 'end' | 'error' | 'delay';
  nextNodeId?: string;
  result?: Partial<ExecutionResult>;
  error?: string;
}

export class FlowEngine {
  private nodes: FlowNode[];
  private edges: FlowEdge[];
  private loadSharedFunction?: (id: string) => Promise<{ nodes: FlowNode[]; edges: FlowEdge[] } | null>;
  private isSubFlow: boolean;

  constructor(
    nodes: FlowNode[],
    edges: FlowEdge[],
    options?: {
      loadSharedFunction?: (id: string) => Promise<{ nodes: FlowNode[]; edges: FlowEdge[] } | null>;
      isSubFlow?: boolean;
    }
  ) {
    this.nodes = nodes;
    this.edges = edges;
    this.loadSharedFunction = options?.loadSharedFunction;
    this.isSubFlow = options?.isSubFlow || false;
  }

  private findNode(nodeId: string): FlowNode | undefined {
    return this.nodes.find((n) => n.id === nodeId);
  }

  private findEdgesFrom(nodeId: string): FlowEdge[] {
    return this.edges.filter((e) => e.source === nodeId);
  }

  private replaceVariables(text: string, context: ExecutionContext): string {
    return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const parts = path.split('.');
      let value: any = context;

      for (const part of parts) {
        if (value === null || value === undefined) return match;
        if (part === 'request') value = context.request;
        else if (part === 'variables') value = context.variables;
        else if (part === 'query') value = context.request.query;
        else if (part === 'headers') value = context.request.headers;
        else if (part === 'body') value = context.request.body;
        else if (typeof value === 'object') value = value[part];
        else return match;
      }

      if (value === undefined || value === null) return match;
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
  }

  private getValueByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let value: any = obj;
    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        value = value[key];
        if (Array.isArray(value)) value = value[parseInt(index)];
      } else {
        value = value[part];
      }
    }
    return value;
  }

  private evaluateCondition(
    conditionType: string,
    conditionValue: string,
    context: ExecutionContext
  ): boolean {
    const input = String(context.variables._lastValue || '').toLowerCase().trim();
    const compareValue = conditionValue.toLowerCase().trim();

    switch (conditionType) {
      case 'equals':
        return input === compareValue;
      case 'contains':
        return input.includes(compareValue);
      case 'startsWith':
        return input.startsWith(compareValue);
      case 'endsWith':
        return input.endsWith(compareValue);
      case 'regex':
        try {
          return new RegExp(compareValue, 'i').test(input);
        } catch {
          return false;
        }
      case 'default':
        return true;
      default:
        return input.includes(conditionType.toLowerCase());
    }
  }

  async processNode(
    node: FlowNode,
    context: ExecutionContext
  ): Promise<ProcessResult> {
    const { type, data } = node;

    switch (type) {
      case 'trigger':
        return { action: 'continue' };

      case 'set_variable': {
        const vars = data.variables || [];
        for (const v of vars) {
          const val = this.replaceVariables(v.value || '', context);
          // Try parse JSON
          let parsed = val;
          try {
            parsed = JSON.parse(val);
          } catch {
            // keep as string
          }
          context.variables[v.name] = parsed;
        }
        return { action: 'continue' };
      }

      case 'transform': {
        const transformType = data.transformType || 'json_path';
        const inputVar = data.inputVariable || '';
        const outputVar = data.outputVariable || '';
        const inputValue = context.variables[inputVar];

        let result: any = inputValue;

        if (transformType === 'json_path' && data.jsonPath) {
          result = this.getValueByPath(inputValue, data.jsonPath);
        } else if (transformType === 'template' && data.template) {
          result = this.replaceVariables(data.template, context);
        } else if (transformType === 'uppercase') {
          result = String(inputValue || '').toUpperCase();
        } else if (transformType === 'lowercase') {
          result = String(inputValue || '').toLowerCase();
        } else if (transformType === 'parse_json' && typeof inputValue === 'string') {
          try {
            result = JSON.parse(inputValue);
          } catch {
            result = null;
          }
        } else if (transformType === 'stringify' && typeof inputValue !== 'string') {
          result = JSON.stringify(inputValue);
        }

        if (outputVar) {
          context.variables[outputVar] = result;
        }
        context.variables._lastValue = result;
        return { action: 'continue' };
      }

      case 'http_request': {
        try {
          const url = this.replaceVariables(data.url || '', context);
          const method = (data.method || 'GET').toUpperCase();
          const timeout = Math.max(Number(data.timeout) || 10000, 1000);

          let headers: Record<string, string> = {};
          if (data.headers && typeof data.headers === 'object') {
            for (const [k, v] of Object.entries(data.headers)) {
              headers[k] = this.replaceVariables(String(v), context);
            }
          }

          let body: any = undefined;
          if (data.body) {
            const rawBody =
              typeof data.body === 'string'
                ? data.body
                : JSON.stringify(data.body);
            body = this.replaceVariables(rawBody, context);
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const fetchOptions: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json', ...headers },
            signal: controller.signal,
          };

          if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
            fetchOptions.body = body;
          }

          let responseData: any = null;
          let statusCode = 0;
          let requestError: string | null = null;

          try {
            const res = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);
            statusCode = res.status;
            const text = await res.text();
            try {
              responseData = JSON.parse(text);
            } catch {
              responseData = text;
            }
          } catch (err: any) {
            clearTimeout(timeoutId);
            requestError = err.name === 'AbortError' ? 'Request timeout' : err.message;
          }

          if (data.saveResponseTo) {
            context.variables[data.saveResponseTo] = responseData;
          }
          if (data.saveStatusTo) {
            context.variables[data.saveStatusTo] = statusCode;
          }
          if (requestError && data.errorVariable) {
            context.variables[data.errorVariable] = { error: true, message: requestError };
          }

          // Route to success/error branch
          const httpEdges = this.findEdgesFrom(node.id);
          const successEdge = httpEdges.find(
            (e) => e.sourceHandle === 'success' || e.condition === 'success'
          );
          const errorEdge = httpEdges.find(
            (e) => e.sourceHandle === 'error' || e.condition === 'error'
          );

          if (requestError || statusCode < 200 || statusCode >= 300) {
            return {
              action: 'continue',
              nextNodeId: errorEdge?.target || httpEdges[0]?.target,
            };
          }
          return {
            action: 'continue',
            nextNodeId: successEdge?.target || httpEdges[0]?.target,
          };
        } catch (err: any) {
          return { action: 'error', error: err.message };
        }
      }

      case 'condition': {
        const conditions = data.conditions || [{ type: 'default', condition: 'default' }];
        const conditionEdges = this.findEdgesFrom(node.id);

        for (let i = 0; i < conditions.length; i++) {
          const cond = conditions[i];
          const condType = cond.type || 'default';
          const condValue = cond.condition || '';

          // Check variable condition
          let checkValue = context.variables._lastValue;
          if (cond.variableName) {
            checkValue = context.variables[cond.variableName];
          }
          context.variables._lastValue = checkValue;

          if (condType === 'default') {
            const edge = conditionEdges.find((e) => e.sourceHandle === `condition-${i}`);
            return { action: 'continue', nextNodeId: edge?.target || conditionEdges[0]?.target };
          }

          const matched = this.evaluateCondition(condType, condValue, context);
          if (matched) {
            const edge = conditionEdges.find((e) => e.sourceHandle === `condition-${i}`);
            return { action: 'continue', nextNodeId: edge?.target || conditionEdges[i]?.target };
          }
        }

        // Fallback
        return { action: 'continue', nextNodeId: conditionEdges[0]?.target };
      }

      case 'delay': {
        const duration =
          (data.duration || 0) *
          (data.unit === 'minutes' ? 60 : data.unit === 'hours' ? 3600 : 1);
        if (duration > 0) {
          await new Promise((r) => setTimeout(r, duration * 1000));
        }
        return { action: 'continue' };
      }

      case 'random_split': {
        const branches = data.branches || [{ percentage: 50 }, { percentage: 50 }];
        const splitEdges = this.findEdgesFrom(node.id);
        const random = Math.random() * 100;
        let cumulative = 0;

        for (let i = 0; i < branches.length; i++) {
          cumulative += branches[i].percentage;
          if (random <= cumulative) {
            const edge = splitEdges.find((e) => e.sourceHandle === `branch-${i}`);
            return { action: 'continue', nextNodeId: edge?.target || splitEdges[i]?.target };
          }
        }

        return { action: 'continue', nextNodeId: splitEdges[0]?.target };
      }

      case 'validate_input': {
        const rules = data.rules || [];
        const validationEdges = this.findEdgesFrom(node.id);
        const validEdge = validationEdges.find((e) => e.sourceHandle === 'valid' || e.condition === 'valid');
        const invalidEdge = validationEdges.find((e) => e.sourceHandle === 'invalid' || e.condition === 'invalid');

        for (const rule of rules) {
          const source = rule.source || 'body'; // body | query | headers
          const field = rule.field || '';
          const ruleType = rule.type || 'required';
          const ruleValue = rule.value || '';
          const errorMessage = rule.errorMessage || `Validation failed for ${field}`;

          let value: any;
          if (source === 'body') value = context.request.body;
          else if (source === 'query') value = context.request.query[field];
          else if (source === 'headers') value = context.request.headers[field.toLowerCase()];

          // Handle nested body fields (e.g., "user.phone")
          if (source === 'body' && field.includes('.')) {
            value = this.getValueByPath(context.request.body, field);
          } else if (source === 'body' && field) {
            value = context.request.body?.[field];
          }

          let isValid = true;

          switch (ruleType) {
            case 'required':
              isValid = value !== undefined && value !== null && String(value).trim() !== '';
              break;
            case 'email':
              isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
              break;
            case 'phone':
              isValid = /^[0-9+\-\s()]{8,20}$/.test(String(value || ''));
              break;
            case 'number':
              isValid = !isNaN(Number(value)) && value !== '';
              break;
            case 'minLength':
              isValid = String(value || '').length >= Number(ruleValue);
              break;
            case 'maxLength':
              isValid = String(value || '').length <= Number(ruleValue);
              break;
            case 'regex':
              try {
                isValid = new RegExp(ruleValue).test(String(value || ''));
              } catch {
                isValid = false;
              }
              break;
            case 'equals':
              isValid = String(value || '') === ruleValue;
              break;
            case 'contains':
              isValid = String(value || '').includes(ruleValue);
              break;
            case 'startsWith':
              isValid = String(value || '').startsWith(ruleValue);
              break;
            case 'endsWith':
              isValid = String(value || '').endsWith(ruleValue);
              break;
            case 'json':
              try {
                JSON.parse(String(value || '{}'));
                isValid = true;
              } catch {
                isValid = false;
              }
              break;
            default:
              isValid = true;
          }

          if (!isValid) {
            context.variables._validationError = errorMessage;
            context.variables._validationField = field;
            context.variables._validationRule = ruleType;

            if (invalidEdge) {
              return {
                action: 'continue',
                nextNodeId: invalidEdge.target,
              };
            }

            const errorStatusCode = Number(data.errorStatusCode) || 400;
            const errorResponseType = data.errorResponseType || 'json';
            let contentType: ExecutionResult['contentType'] = 'application/json';
            if (errorResponseType === 'text') contentType = 'text/plain';
            if (errorResponseType === 'xml') contentType = 'application/xml';

            let finalBody = data.errorBody
              ? this.replaceVariables(String(data.errorBody), context)
              : JSON.stringify({ error: errorMessage, field, rule: ruleType });

            if (errorResponseType === 'json') {
              try {
                JSON.parse(finalBody);
              } catch {
                finalBody = JSON.stringify({ error: finalBody });
              }
            }

            return {
              action: 'end',
              result: {
                statusCode: errorStatusCode,
                contentType,
                body: finalBody,
              },
            };
          }
        }

        return {
          action: 'continue',
          nextNodeId: validEdge?.target || validationEdges[0]?.target,
        };
      }

      case 'variable_check': {
        const varName = data.variableName || '';
        const checkType = data.checkType || 'exists'; // exists | equals | contains | regex | empty
        const checkValue = data.checkValue || '';
        const errorMessage = data.errorMessage || 'Variable check failed';
        const errorStatusCode = Number(data.errorStatusCode) || 400;
        const errorResponseType = data.errorResponseType || 'json';

        // Lookup variable from multiple sources: variables > query > body > headers
        let variableValue = context.variables[varName];
        if (variableValue === undefined) {
          variableValue = context.request.query[varName];
        }
        if (variableValue === undefined && context.request.body && typeof context.request.body === 'object') {
          variableValue = context.request.body[varName];
        }
        if (variableValue === undefined) {
          variableValue = context.request.headers[varName.toLowerCase()];
        }
        let checkPassed = true;

        switch (checkType) {
          case 'exists':
            checkPassed = variableValue !== undefined && variableValue !== null;
            break;
          case 'empty':
            checkPassed = variableValue === undefined || variableValue === null || String(variableValue).trim() === '';
            break;
          case 'notEmpty':
            checkPassed = variableValue !== undefined && variableValue !== null && String(variableValue).trim() !== '';
            break;
          case 'equals':
            checkPassed = String(variableValue || '') === checkValue;
            break;
          case 'notEquals':
            checkPassed = String(variableValue || '') !== checkValue;
            break;
          case 'contains':
            checkPassed = String(variableValue || '').includes(checkValue);
            break;
          case 'startsWith':
            checkPassed = String(variableValue || '').startsWith(checkValue);
            break;
          case 'endsWith':
            checkPassed = String(variableValue || '').endsWith(checkValue);
            break;
          case 'regex':
            try {
              checkPassed = new RegExp(checkValue).test(String(variableValue || ''));
            } catch {
              checkPassed = false;
            }
            break;
          case 'gt':
            checkPassed = Number(variableValue) > Number(checkValue);
            break;
          case 'gte':
            checkPassed = Number(variableValue) >= Number(checkValue);
            break;
          case 'lt':
            checkPassed = Number(variableValue) < Number(checkValue);
            break;
          case 'lte':
            checkPassed = Number(variableValue) <= Number(checkValue);
            break;
          default:
            checkPassed = true;
        }

        const checkEdges = this.findEdgesFrom(node.id);
        const passEdge = checkEdges.find((e) => e.sourceHandle === 'pass' || e.condition === 'pass');
        const failEdge = checkEdges.find((e) => e.sourceHandle === 'fail' || e.condition === 'fail');

        console.log('[variable_check]', {
          nodeId: node.id,
          varName,
          checkType,
          variableValue,
          checkPassed,
          edges: checkEdges.map((e) => ({ id: e.id, sourceHandle: e.sourceHandle, target: e.target })),
          passEdge: passEdge?.target,
          failEdge: failEdge?.target,
        });

        if (!checkPassed) {
          // If failReturnResponse is true, return error response immediately
          if (data.failReturnResponse === true) {
            let contentType: ExecutionResult['contentType'] = 'application/json';
            if (errorResponseType === 'text') contentType = 'text/plain';
            if (errorResponseType === 'xml') contentType = 'application/xml';

            let finalBody = this.replaceVariables(errorMessage, context);
            if (errorResponseType === 'json') {
              try {
                JSON.parse(finalBody);
              } catch {
                finalBody = JSON.stringify({ error: finalBody });
              }
            }

            return {
              action: 'end',
              result: {
                statusCode: errorStatusCode,
                contentType,
                body: finalBody,
              },
            };
          }

          return {
            action: 'continue',
            nextNodeId: failEdge?.target || checkEdges[0]?.target,
          };
        }

        return {
          action: 'continue',
          nextNodeId: passEdge?.target || checkEdges[0]?.target,
        };
      }

      case 'call_function': {
        const functionId = data.functionId;
        if (!functionId || !this.loadSharedFunction) {
          return { action: 'continue' };
        }
        const sharedFlow = await this.loadSharedFunction(functionId);
        if (!sharedFlow) {
          return { action: 'error', error: `Shared function ${functionId} not found` };
        }
        const subEngine = new FlowEngine(sharedFlow.nodes, sharedFlow.edges, {
          loadSharedFunction: this.loadSharedFunction,
          isSubFlow: true,
        });
        const subResult = await subEngine.runFlow(context);
        if (subResult.ended && subResult.result) {
          return { action: 'end', result: subResult.result };
        }
        const callEdges = this.findEdgesFrom(node.id);
        return { action: 'continue', nextNodeId: callEdges[0]?.target };
      }

      case 'response': {
        const responseType = data.responseType || 'json';
        const statusCode = Number(data.statusCode) || 200;
        const rawBody = data.body || '';
        const body = this.replaceVariables(rawBody, context);

        let contentType: ExecutionResult['contentType'] = 'application/json';
        if (responseType === 'text') contentType = 'text/plain';
        if (responseType === 'xml') contentType = 'application/xml';

        // Parse JSON if needed
        let finalBody = body;
        if (responseType === 'json') {
          try {
            // If body is a template, try to parse it as JSON
            JSON.parse(body);
          } catch {
            // Wrap in object if not valid JSON
            finalBody = JSON.stringify({ message: body });
          }
        }

        let responseHeaders: Record<string, string> = {};
        if (data.headers && typeof data.headers === 'object') {
          for (const [k, v] of Object.entries(data.headers)) {
            responseHeaders[k] = this.replaceVariables(String(v), context);
          }
        }

        return {
          action: 'end',
          result: {
            statusCode,
            contentType,
            body: finalBody,
            headers: responseHeaders,
          },
        };
      }

      default:
        return { action: 'continue' };
    }
  }

  private async runFlow(
    context: ExecutionContext
  ): Promise<{ ended: boolean; result?: ExecutionResult }> {
    let currentNode: FlowNode | undefined;

    if (this.isSubFlow) {
      // Sub-flow: start from first node (trigger optional)
      currentNode = this.nodes[0];
    } else {
      const triggerNode = this.nodes.find((n) => n.type === 'trigger');
      if (!triggerNode) {
        return {
          ended: true,
          result: {
            statusCode: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'No trigger node found in flow' }),
          },
        };
      }
      // Set initial variables from request (only for main flow)
      context.variables.query = context.request.query;
      context.variables.headers = context.request.headers;
      context.variables.body = context.request.body;
      context.variables._lastValue = context.request.body;
      currentNode = triggerNode;
    }
    const visited = new Set<string>();
    let result: ExecutionResult | undefined;

    while (currentNode) {
      if (visited.has(currentNode.id)) {
        return {
          ended: true,
          result: {
            statusCode: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Circular flow detected' }),
          },
        };
      }
      visited.add(currentNode.id);

      const processResult = await this.processNode(currentNode, context);

      if (processResult.action === 'end' && processResult.result) {
        result = processResult.result as ExecutionResult;
        break;
      }

      if (processResult.action === 'error') {
        return {
          ended: true,
          result: {
            statusCode: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: processResult.error || 'Flow execution error' }),
          },
        };
      }

      if (processResult.nextNodeId) {
        currentNode = this.findNode(processResult.nextNodeId);
      } else {
        const edges = this.findEdgesFrom(currentNode.id);
        currentNode = edges.length > 0 ? this.findNode(edges[0].target) : undefined;
      }
    }

    return {
      ended: !!result,
      result:
        result || {
          statusCode: 204,
          contentType: 'application/json',
          body: JSON.stringify({}),
        },
    };
  }

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const { result } = await this.runFlow(context);
    return result!;
  }
}
