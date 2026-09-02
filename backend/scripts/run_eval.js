/**
 * scripts/run_eval.js
 * Evaluates the Agentic Text-to-SQL system against a dataset of questions.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { runAnalystAgent } from '../src/agents/analyst.js';
import { classifyInput } from '../src/agents/classifier.js';

// Dummy IO for the agent
const dummyIo = {
  to: () => ({ emit: () => {} })
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runEval() {
  const datasetPath = path.resolve('./eval/dataset.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

  console.log(`Starting Evaluation of ${dataset.length} queries...\n`);

  let correctCount = 0;
  let totalLatency = 0;
  let totalRetries = 0;

  for (let i = 0; i < dataset.length; i++) {
    const { question, expected_sql_contains } = dataset[i];
    console.log(`[${i + 1}/${dataset.length}] Question: "${question}"`);

    const start = Date.now();
    let sqlRetries = 0;
    let generatedSql = '';

    try {
      // 1. Classifier
      const { classification } = await classifyInput(question);
      if (classification !== 'VALID_QUERY') {
        console.log(`   ❌ Failed at classification: ${classification}`);
        continue;
      }

      // 2. Agent Execution
      // We pass a mock io and capture console/logs manually if needed
      // To get the SQL and retries, we can capture them through a custom emit handler if we wanted,
      // but for simplicity, we can let the agent run and we can mock `io.to().emit()` to capture it.
      
      let capturedSqls = [];
      let currentError = null;
      
      const captureIo = {
        to: () => ({
          emit: (event, data) => {
            if (event === 'agent:tool_start' && data.sql) {
              capturedSqls.push(data.sql.toLowerCase());
            }
            if (event === 'agent:error') {
              sqlRetries++;
            }
          }
        })
      };

      await runAnalystAgent({ question, io: captureIo, socketId: 'eval' });
      
      const latency = Date.now() - start;
      totalLatency += latency;
      totalRetries += sqlRetries;

      generatedSql = capturedSqls.length > 0 ? capturedSqls[capturedSqls.length - 1] : '';

      // 3. Validation
      let passed = true;
      const missingKeywords = [];
      
      for (const keyword of expected_sql_contains) {
        if (!generatedSql.includes(keyword.toLowerCase())) {
          passed = false;
          missingKeywords.push(keyword);
        }
      }

      if (passed && generatedSql) {
        console.log(`   ✅ Passed (Latency: ${latency}ms, Retries: ${sqlRetries})`);
        correctCount++;
      } else if (!generatedSql) {
        console.log(`   ❌ Failed: No SQL generated`);
      } else {
        console.log(`   ❌ Failed: Missing keywords [${missingKeywords.join(', ')}]`);
        console.log(`      Generated SQL: ${generatedSql}`);
      }

    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }

    // Add a delay between requests to avoid Gemini free-tier rate limits (5 RPM)
    if (i < dataset.length - 1) {
      console.log(`   ⏳ Waiting 45s to respect API rate limits (Free Tier allows 15 RPM)...`);
      await delay(45000);
    }
  }

  const accuracy = ((correctCount / dataset.length) * 100).toFixed(1);
  const avgLatency = (totalLatency / dataset.length).toFixed(0);
  const avgRetries = (totalRetries / dataset.length).toFixed(2);

  console.log('\n======================================');
  console.log('         EVALUATION RESULTS           ');
  console.log('======================================');
  console.log(`Total Queries:  ${dataset.length}`);
  console.log(`Accuracy:       ${accuracy}% (${correctCount}/${dataset.length})`);
  console.log(`Avg Latency:    ${avgLatency}ms`);
  console.log(`Avg Retries:    ${avgRetries}`);
  console.log('======================================\n');
  
  process.exit(0);
}

runEval();
