import postgres from 'postgres';
import { nanoid } from 'nanoid';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgres://sandbox:StrongPassword123@127.0.0.1:6432/sandbox';

async function updateFlows() {
  console.log('🎨 Updating showcase flows for screenshot perfection...');
  const sql = postgres(DATABASE_URL);

  try {
    const [user] = await sql`
      SELECT id FROM users WHERE email = 'adysanjaya013@gmail.com' LIMIT 1;
    `;
    if (!user) throw new Error('User not found');
    const userId = user.id;

    // 1. Flagship Flow: Create Checkout Session Intent
    const checkoutFlow = {
      nodes: [
        {
          id: 'c-trigger',
          type: 'trigger',
          position: { x: 250, y: 40 },
          data: { label: 'HTTP POST Trigger', method: 'POST' },
        },
        {
          id: 'c-validate',
          type: 'validate_input',
          position: { x: 250, y: 170 },
          data: {
            label: 'Validate Order Request',
            rules: [
              'amount: numeric > 0',
              'currency: in [IDR, USD, EUR]',
              'customer_email: required',
            ],
          },
        },
        {
          id: 'c-err-invalid',
          type: 'response',
          position: { x: 620, y: 170 },
          data: {
            label: '422 Unprocessable',
            statusCode: 422,
            responseType: 'json',
            responseBody: JSON.stringify(
              {
                error: 'Unprocessable Entity',
                message: 'Invalid order parameters. Amount must be positive and currency valid.',
              },
              null,
              2
            ),
          },
        },
        {
          id: 'c-call-auth',
          type: 'call_function',
          position: { x: 250, y: 340 },
          data: {
            label: 'Verify Auth Token',
            functionName: 'JWT Token Verifier',
          },
        },
        {
          id: 'c-check-vip',
          type: 'variable_check',
          position: { x: 140, y: 490 },
          data: {
            label: 'Check VIP Membership',
            variableName: 'request.body.is_vip',
            checkType: 'equals true',
          },
        },
        {
          id: 'c-discount-vip',
          type: 'set_variable',
          position: { x: 480, y: 440 },
          data: {
            label: 'Apply 20% VIP Discount',
            variables: [
              { key: 'discount_rate', value: '0.20' },
              { key: 'member_tier', value: 'VIP_PLATINUM' },
            ],
          },
        },
        {
          id: 'c-discount-std',
          type: 'set_variable',
          position: { x: 480, y: 570 },
          data: {
            label: 'Standard Pricing',
            variables: [
              { key: 'discount_rate', value: '0.00' },
              { key: 'member_tier', value: 'REGULAR' },
            ],
          },
        },
        {
          id: 'c-http-stripe',
          type: 'http_request',
          position: { x: 480, y: 720 },
          data: {
            label: 'Stripe Payment Gateway',
            method: 'POST',
            url: 'https://api.stripe.com/v1/payment_intents',
          },
        },
        {
          id: 'c-transform',
          type: 'transform',
          position: { x: 480, y: 860 },
          data: {
            label: 'Format Invoice & Receipt',
            transformType: 'json',
          },
        },
        {
          id: 'c-response',
          type: 'response',
          position: { x: 480, y: 990 },
          data: {
            label: '201 Created Intent',
            statusCode: 201,
            responseType: 'json',
            responseBody: JSON.stringify(
              {
                success: true,
                payment_intent_id: 'pi_3MtwBwLkdIwHu7ix28a391',
                client_secret: 'pi_3MtwBw_secret_8910aBCd...',
                amount: 750000,
                currency: 'idr',
                tier: 'VIP_PLATINUM',
                status: 'requires_payment_method',
                checkout_url: 'https://checkout.stripe.com/c/pay/cs_live_...',
              },
              null,
              2
            ),
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'c-trigger', target: 'c-validate', animated: true },
        { id: 'e2', source: 'c-validate', target: 'c-err-invalid', sourceHandle: 'invalid', animated: true },
        { id: 'e3', source: 'c-validate', target: 'c-call-auth', sourceHandle: 'valid', animated: true },
        { id: 'e4', source: 'c-call-auth', target: 'c-check-vip', animated: true },
        { id: 'e5', source: 'c-check-vip', target: 'c-discount-vip', sourceHandle: 'pass', animated: true },
        { id: 'e6', source: 'c-check-vip', target: 'c-discount-std', sourceHandle: 'fail', animated: true },
        { id: 'e7', source: 'c-discount-vip', target: 'c-http-stripe', animated: true },
        { id: 'e8', source: 'c-discount-std', target: 'c-http-stripe', animated: true },
        { id: 'e9', source: 'c-http-stripe', target: 'c-transform', animated: true },
        { id: 'e10', source: 'c-transform', target: 'c-response', animated: true },
      ],
    };

    await sql`
      UPDATE endpoints
      SET flow_json = ${JSON.stringify(checkoutFlow)},
          updated_at = NOW()
      WHERE user_id = ${userId} AND slug = 'checkout-intent';
    `;
    console.log('  ✓ Updated /checkout-intent flow');

    // 2. AI Agent Pipeline Flow
    const aiFlow = {
      nodes: [
        {
          id: 'ai-trig',
          type: 'trigger',
          position: { x: 260, y: 40 },
          data: { label: 'HTTP POST Trigger', method: 'POST' },
        },
        {
          id: 'ai-val',
          type: 'validate_input',
          position: { x: 260, y: 170 },
          data: {
            label: 'Sanitize Input & Budget',
            rules: ['prompt: required max 2000 chars', 'model: in [gemini-1.5, gpt-4o]'],
          },
        },
        {
          id: 'ai-err',
          type: 'response',
          position: { x: 600, y: 170 },
          data: {
            label: '400 Bad Request',
            statusCode: 400,
            responseType: 'json',
            responseBody: JSON.stringify({ error: 'Validation failed', detail: 'Prompt exceeds token budget' }, null, 2),
          },
        },
        {
          id: 'ai-auth',
          type: 'call_function',
          position: { x: 260, y: 340 },
          data: { label: 'API Key Authenticator', functionName: 'JWT Token Verifier' },
        },
        {
          id: 'ai-http',
          type: 'http_request',
          position: { x: 260, y: 480 },
          data: { label: 'LLM Inference API', method: 'POST', url: 'https://api.openai.com/v1/chat/completions' },
        },
        {
          id: 'ai-delay',
          type: 'delay',
          position: { x: 260, y: 620 },
          data: { label: 'Rate-Limit Throttler', duration: 1, unit: 'seconds' },
        },
        {
          id: 'ai-trans',
          type: 'transform',
          position: { x: 260, y: 750 },
          data: { label: 'Format Markdown & Citations', transformType: 'json' },
        },
        {
          id: 'ai-res',
          type: 'response',
          position: { x: 260, y: 880 },
          data: {
            label: '200 OK AI Analysis Output',
            statusCode: 200,
            responseType: 'json',
            responseBody: JSON.stringify(
              {
                model: 'gemini-1.5-pro',
                status: 'completed',
                output: 'OpenSandbox allows developers to rapidly mock and deploy microservices with visual flow graphs.',
                tokens_used: 142,
                latency_ms: 248,
              },
              null,
              2
            ),
          },
        },
      ],
      edges: [
        { id: 'ae1', source: 'ai-trig', target: 'ai-val', animated: true },
        { id: 'ae2', source: 'ai-val', target: 'ai-err', sourceHandle: 'invalid', animated: true },
        { id: 'ae3', source: 'ai-val', target: 'ai-auth', sourceHandle: 'valid', animated: true },
        { id: 'ae4', source: 'ai-auth', target: 'ai-http', animated: true },
        { id: 'ae5', source: 'ai-http', target: 'ai-delay', animated: true },
        { id: 'ae6', source: 'ai-delay', target: 'ai-trans', animated: true },
        { id: 'ae7', source: 'ai-trans', target: 'ai-res', animated: true },
      ],
    };

    await sql`
      UPDATE endpoints
      SET flow_json = ${JSON.stringify(aiFlow)},
          updated_at = NOW()
      WHERE user_id = ${userId} AND slug = 'ai-completions';
    `;
    console.log('  ✓ Updated /ai-completions flow');

    // 3. A/B Split Testing & Smart Webhook Dispatcher
    const abFlow = {
      nodes: [
        {
          id: 'ab-trig',
          type: 'trigger',
          position: { x: 300, y: 40 },
          data: { label: 'HTTP POST Trigger', method: 'POST' },
        },
        {
          id: 'ab-val',
          type: 'validate_input',
          position: { x: 300, y: 170 },
          data: {
            label: 'Validate Request Schema',
            rules: ['experiment_id: required', 'user_id: required'],
          },
        },
        {
          id: 'ab-err',
          type: 'response',
          position: { x: 640, y: 170 },
          data: {
            label: '400 Bad Request',
            statusCode: 400,
            responseType: 'json',
            responseBody: JSON.stringify({ error: 'Missing experiment_id or user_id' }, null, 2),
          },
        },
        {
          id: 'ab-split',
          type: 'random_split',
          position: { x: 300, y: 340 },
          data: {
            label: 'A/B Traffic Splitter',
            branches: [{ percentage: 50 }, { percentage: 50 }],
          },
        },
        {
          id: 'ab-var-a',
          type: 'set_variable',
          position: { x: 100, y: 500 },
          data: {
            label: 'Variant A: One-Click Pay',
            variables: [
              { key: 'flow_variant', value: 'EXPRESS_CHECKOUT' },
              { key: 'ui_theme', value: 'modern_dark' },
            ],
          },
        },
        {
          id: 'ab-var-b',
          type: 'set_variable',
          position: { x: 460, y: 500 },
          data: {
            label: 'Variant B: Wizard Multi-Step',
            variables: [
              { key: 'flow_variant', value: 'WIZARD_CHECKOUT' },
              { key: 'ui_theme', value: 'classic_light' },
            ],
          },
        },
        {
          id: 'ab-trans',
          type: 'transform',
          position: { x: 280, y: 660 },
          data: {
            label: 'Aggregate Analytics Tag',
            transformType: 'json',
          },
        },
        {
          id: 'ab-res',
          type: 'response',
          position: { x: 280, y: 800 },
          data: {
            label: '200 OK Experiment Routed',
            statusCode: 200,
            responseType: 'json',
            responseBody: JSON.stringify(
              {
                experiment: 'checkout_conversion_v2',
                variant: '{{variables.flow_variant}}',
                theme: '{{variables.ui_theme}}',
                tracking_id: 'exp_8921b7c',
              },
              null,
              2
            ),
          },
        },
      ],
      edges: [
        { id: 'abe1', source: 'ab-trig', target: 'ab-val', animated: true },
        { id: 'abe2', source: 'ab-val', target: 'ab-err', sourceHandle: 'invalid', animated: true },
        { id: 'abe3', source: 'ab-val', target: 'ab-split', sourceHandle: 'valid', animated: true },
        { id: 'abe4', source: 'ab-split', target: 'ab-var-a', sourceHandle: 'branch-0', animated: true },
        { id: 'abe5', source: 'ab-split', target: 'ab-var-b', sourceHandle: 'branch-1', animated: true },
        { id: 'abe6', source: 'ab-var-a', target: 'ab-trans', animated: true },
        { id: 'abe7', source: 'ab-var-b', target: 'ab-trans', animated: true },
        { id: 'abe8', source: 'ab-trans', target: 'ab-res', animated: true },
      ],
    };

    // Find Payments & Billing group
    const [group] = await sql`
      SELECT id FROM endpoint_groups WHERE user_id = ${userId} AND name = 'Payments & Billing' LIMIT 1;
    `;
    const groupId = group?.id || null;

    // Check if ab-testing endpoint exists
    const [existingAb] = await sql`
      SELECT id FROM endpoints WHERE user_id = ${userId} AND slug = 'ab-testing' LIMIT 1;
    `;

    if (existingAb) {
      await sql`
        UPDATE endpoints
        SET name = 'A/B Split Test & Smart Router',
            flow_json = ${JSON.stringify(abFlow)},
            updated_at = NOW()
        WHERE id = ${existingAb.id};
      `;
      console.log('  ✓ Updated /ab-testing flow');
    } else {
      await sql`
        INSERT INTO endpoints (id, user_id, group_id, name, slug, method, flow_json, is_active, created_at, updated_at)
        VALUES (${nanoid()}, ${userId}, ${groupId}, 'A/B Split Test & Smart Router', 'ab-testing', 'POST', ${JSON.stringify(abFlow)}, true, NOW(), NOW());
      `;
      console.log('  + Created /ab-testing flow');
    }

    console.log('🎉 Flow showcase update complete!');
  } catch (err) {
    console.error('❌ Failed:', err);
  } finally {
    await sql.end();
  }
}

updateFlows();
