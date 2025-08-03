/**
 * Verify Output Display Test
 * Tests that workflow execution results are properly displayed
 */

import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';

test.describe('Workflow Output Display', () => {
  let backendProcess;

  test.beforeAll(async () => {
    // Start backend if not running
    const backendPath = path.join(process.cwd(), '../backend');
    backendProcess = spawn('python', ['-m', 'uvicorn', 'main:app', '--port', '8000'], {
      cwd: backendPath,
      env: { ...process.env, PYTHONPATH: backendPath },
    });

    // Wait for backend to start
    await new Promise((resolve) => {
      backendProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Uvicorn running')) {
          console.log('✅ Backend started');
          resolve();
        }
      });
      // Timeout after 10 seconds
      setTimeout(resolve, 10000);
    });
  });

  test.afterAll(async () => {
    if (backendProcess) {
      backendProcess.kill();
      console.log('🛑 Backend stopped');
    }
  });

  test('display Chinese translation output in workflow', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes

    // Monitor console
    page.on('console', (msg) => {
      console.log(`[Browser] ${msg.text()}`);
    });

    // Monitor requests/responses
    page.on('request', (request) => {
      if (request.url().includes('/api/workflows/execute')) {
        console.log('\n📤 API Request:', request.method(), request.url());
        const postData = request.postData();
        if (postData) {
          const parsed = JSON.parse(postData);
          console.log('Request body:', JSON.stringify(parsed, null, 2));
        }
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/workflows/execute')) {
        console.log('\n📥 API Response:', response.status());
        try {
          const body = await response.json();
          console.log('Response body:', JSON.stringify(body, null, 2));
        } catch (e) {
          console.log('Could not parse response');
        }
      }
    });

    // Go to workflow builder
    await page.goto('http://localhost:3000/workflow-builder.html');
    await page.waitForLoadState('networkidle');

    console.log('\n🎯 Testing Workflow Output Display');
    console.log('═'.repeat(70));

    // Create simple workflow: Input -> LLM (Chinese translation)
    console.log('\n1️⃣ Creating Input Node...');
    await page.locator('div[data-node-type="input"]').click();
    await page.waitForTimeout(1000);

    // Configure input node
    const inputNode = page.locator('.drawflow-node.input').first();
    await inputNode.click();
    await page.waitForSelector('#configPanel.open');

    const inputTextarea = page.locator('#configPanel textarea').first();
    await inputTextarea.fill('Hello, how are you today?');

    // Close config
    await page.evaluate(() => {
      document.getElementById('configPanel').classList.remove('open');
    });
    await page.waitForTimeout(500);

    console.log('\n2️⃣ Creating LLM Node...');
    await page.locator('div[data-node-type="llm"]').click();
    await page.waitForTimeout(1000);

    // Configure LLM node
    const llmNode = page.locator('.drawflow-node.llm').first();
    await llmNode.click();
    await page.waitForSelector('#configPanel.open');

    // Select Ollama
    console.log('\n3️⃣ Configuring Ollama...');
    const ollamaCheckbox = page.locator('#configPanel input[type="checkbox"][value="ollama"]');
    await ollamaCheckbox.check();

    // Set prompt
    const promptTextarea = page.locator('#configPanel textarea').first();
    await promptTextarea.fill('Translate to Chinese: {input}');

    // Close config
    await page.evaluate(() => {
      document.getElementById('configPanel').classList.remove('open');
    });
    await page.waitForTimeout(500);

    console.log('\n4️⃣ Connecting nodes...');
    await page.evaluate(() => {
      window.workflowBuilder.editor.addConnection(1, 2, 'output_1', 'input_1');
    });
    await page.waitForTimeout(500);

    console.log('\n5️⃣ Running workflow...');
    await page.locator('button:has-text("Run")').click();

    // Wait for execution
    console.log('\n⏳ Waiting for results...');

    // Wait for modal to appear
    await page.waitForSelector('#resultsModal', { timeout: 60000 });
    console.log('\n✅ Results modal appeared!');

    // Check modal content
    const modalContent = await page.locator('#resultsModal .modal-body').textContent();
    console.log('\n📊 MODAL CONTENT:');
    console.log('─'.repeat(70));
    console.log(modalContent);
    console.log('─'.repeat(70));

    // Look for Chinese characters
    const hasChineseChars = /[\u4e00-\u9fa5]/.test(modalContent);
    if (hasChineseChars) {
      const chineseText = modalContent.match(/[\u4e00-\u9fa5]+[，。！？\u4e00-\u9fa5\s]*/g);
      console.log('\n🇨🇳 CHINESE TRANSLATION FOUND:');
      if (chineseText) {
        chineseText.forEach((text) => console.log('  ', text));
      }
    }

    // Check node visual state
    const nodes = await page.locator('.drawflow-node').all();
    for (const node of nodes) {
      const classes = await node.getAttribute('class');
      if (classes.includes('execution-success')) {
        console.log('\n✅ Node has execution-success class');

        // Check for output preview
        const outputPreview = await node
          .locator('.node-output-preview')
          .textContent()
          .catch(() => null);
        if (outputPreview) {
          console.log('📝 Output preview:', outputPreview);
        }
      }
    }

    // Take screenshot
    await page.screenshot({
      path: 'test-results/workflow-with-output-display.png',
      fullPage: true,
    });

    console.log('\n📸 Screenshot: test-results/workflow-with-output-display.png');

    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('TEST SUMMARY:');
    console.log('═'.repeat(70));
    console.log(
      'Modal displayed:',
      (await page.locator('#resultsModal').isVisible()) ? '✅' : '❌'
    );
    console.log('Chinese output found:', hasChineseChars ? '✅' : '❌');
    console.log(
      'Visual feedback:',
      (await page.locator('.execution-success').count()) > 0 ? '✅' : '❌'
    );
    console.log('═'.repeat(70));
  });
});
