const { test, expect } = require('@playwright/test');
const Typo = require('typo-js');
const fs = require('fs').promises;

test('Check spelling in a specific div', async ({ page }) => {
  // 1. Navigate to the page you want to test
  await page.goto('https://smartshipper.instavans.com/login');

  // 2. Load the dictionary and initialize the spell checker
  let typo;
  try {
    // Load the American English dictionary.
    const affData = await fs.readFile('dictionaries/en_US.aff', 'utf-8');
    const dicData = await fs.readFile('dictionaries/en_US.dic', 'utf-8');
    typo = new Typo('en_US', affData, dicData);
  } catch (error) {
    console.error('Error loading dictionary:', error);
    expect(true).toBe(false); // Fail the test if dictionary loading fails
    return;
  }

  // 3. Define the CSS selector for the target div
  const targetDivSelector = 'body > app-root > div.body > app-landing-page'; // Replace with the actual ID of your div

  // 4. Function to extract text from the div
  async function extractTextFromDiv(page, selector) {
    const textContent = await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      return element ? element.textContent : '';
    }, selector);
    return textContent.toLowerCase().replace(/[^a-z\s']/gi, '').split(/\s+/).filter(word => word !== '');
  }

  // 5. Function to find potential spelling mistakes
  async function findSpellingMistakes(words, typoInstance) {
    const mistakes = [];
    const trulyKnownSingleWords = new Set([
      'time',
      'insights',
      'analytics',
      'effi',
      'chainfor',
      'realtime',
      'efficiencyenter',
      'addresspasswordforgot',
      'passwordlog'
    ]); // Add your known exceptions

    for (const word of words) {
      const cleanedWord = word.trim(); // Trim whitespace
      if (cleanedWord && !trulyKnownSingleWords.has(cleanedWord) && !typoInstance.check(cleanedWord)) {
        mistakes.push(cleanedWord);
      }
    }
    return mistakes;
  }

  // 6. Execute the functions
  const wordsInDiv = await extractTextFromDiv(page, targetDivSelector);
  const spellingErrors = await findSpellingMistakes(wordsInDiv, typo);

  // 7. Assertion and Reporting
  if (spellingErrors.length > 0) {
    console.error('Potential spelling errors found in the div:', spellingErrors);
    expect(spellingErrors).toHaveLength(0);
  } else {
    console.log('No immediately obvious spelling errors found in the specified div.');
    expect(true).toBe(true);
  }
});