#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { OpenAI } from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';

const program = new Command();
const execAsync = promisify(exec);

// Constants
const MAX_CHUNK_SIZE = 4000; // OpenAI TTS limit is 4096 characters

// Supported file formats and their MIME types
const SUPPORTED_FORMATS = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.ts': 'text/typescript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.xml': 'text/xml',
  '.csv': 'text/csv'
};

// OpenAI voice options
const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

// Audio format options
const AUDIO_FORMATS = ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'];

program
  .name('reading-lamp')
  .description('Convert text to speech using OpenAI API')
  .version('1.0.0')
  .option('-k, --api-key <key>', 'OpenAI API key')
  .option('-t, --text <text>', 'Text to convert to speech')
  .option('-f, --file <path>', 'Path to text file')
  .option('-v, --voice <voice>', `Voice to use (${VOICES.join(', ')})`)
  .option('-a, --audio-format <format>', `Audio format (${AUDIO_FORMATS.join(', ')})`)
  .option('-o, --output <filename>', 'Output filename (without extension)', 'output')
  .parse();

const options = program.opts();

async function main() {
  try {
    console.log(chalk.blue.bold('🔦 Reading Lamp - Text to Speech Converter\n'));

    // Get configuration
    const config = await getConfiguration();
    
    // Validate configuration
    await validateConfiguration(config);

    // Get text content
    const text = await getTextContent(config);

    // Convert text to speech
    await convertTextToSpeech(config, text);

    console.log(chalk.green.bold('✅ Conversion completed successfully!'));
  } catch (error) {
    console.error(chalk.red.bold('❌ Error:'), error.message);
    process.exit(1);
  }
}

async function getConfiguration() {
  const config = {};

  // API Key
  config.apiKey = options.apiKey || 
                  process.env.OPENAI_API_KEY || 
                  process.env.READING_LAMP_API_KEY;

  if (!config.apiKey) {
    const response = await inquirer.prompt([{
      type: 'password',
      name: 'apiKey',
      message: 'Enter your OpenAI API key:',
      mask: '*'
    }]);
    config.apiKey = response.apiKey;
  }

  // Text or File
  if (options.text) {
    config.textSource = 'direct';
    config.text = options.text;
  } else if (options.file) {
    config.textSource = 'file';
    config.filePath = options.file;
  } else {
    const response = await inquirer.prompt([{
      type: 'list',
      name: 'textSource',
      message: 'How would you like to provide the text?',
      choices: [
        { name: 'Enter text directly', value: 'direct' },
        { name: 'Load from file', value: 'file' }
      ]
    }]);
    
    config.textSource = response.textSource;
    
    if (response.textSource === 'direct') {
      const textResponse = await inquirer.prompt([{
        type: 'editor',
        name: 'text',
        message: 'Enter the text to convert:'
      }]);
      config.text = textResponse.text;
    } else {
      const fileResponse = await inquirer.prompt([{
        type: 'input',
        name: 'filePath',
        message: 'Enter the path to the text file:'
      }]);
      config.filePath = fileResponse.filePath;
    }
  }

  // Voice
  config.voice = options.voice || process.env.READING_LAMP_VOICE;
  if (!config.voice) {
    const response = await inquirer.prompt([{
      type: 'list',
      name: 'voice',
      message: 'Select a voice:',
      choices: VOICES.map(voice => ({ name: voice, value: voice })),
      default: 'alloy'
    }]);
    config.voice = response.voice;
  }

  // Audio Format
  config.audioFormat = options.audioFormat || process.env.READING_LAMP_AUDIO_FORMAT;
  if (!config.audioFormat) {
    const response = await inquirer.prompt([{
      type: 'list',
      name: 'audioFormat',
      message: 'Select audio format:',
      choices: AUDIO_FORMATS.map(format => ({ name: format, value: format })),
      default: 'mp3'
    }]);
    config.audioFormat = response.audioFormat;
  }

  // Output filename
  config.output = options.output || process.env.READING_LAMP_OUTPUT || 'output';

  return config;
}

async function validateConfiguration(config) {
  // Validate API key format
  if (!config.apiKey || !config.apiKey.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format');
  }

  // Validate voice
  if (!VOICES.includes(config.voice)) {
    throw new Error(`Invalid voice. Supported voices: ${VOICES.join(', ')}`);
  }

  // Validate audio format
  if (!AUDIO_FORMATS.includes(config.audioFormat)) {
    throw new Error(`Invalid audio format. Supported formats: ${AUDIO_FORMATS.join(', ')}`);
  }

  // Validate file exists if using file input
  if (config.textSource === 'file') {
    try {
      await fs.access(config.filePath);
    } catch {
      throw new Error(`File not found: ${config.filePath}`);
    }
  }
}

async function getTextContent(config) {
  if (config.textSource === 'direct') {
    return config.text;
  }

  const spinner = ora('Reading file...').start();
  
  try {
    const filePath = path.resolve(config.filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    if (!SUPPORTED_FORMATS[ext]) {
      spinner.warn(`Unknown file type: ${ext}. Attempting to read as plain text.`);
    }
    
    const content = await fs.readFile(filePath, 'utf-8');
    
    if (!content.trim()) {
      throw new Error('File is empty');
    }

    spinner.succeed(`File read successfully (${content.length} characters)`);
    return content;
  } catch (error) {
    spinner.fail('Failed to read file');
    throw error;
  }
}

function chunkText(text) {
  if (text.length <= MAX_CHUNK_SIZE) {
    return [text];
  }

  const chunks = [];
  let currentChunk = '';
  
  // Split by sentences first
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    // If a single sentence is too long, split by words
    if (sentence.length > MAX_CHUNK_SIZE) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      const words = sentence.split(' ');
      let wordChunk = '';
      
      for (const word of words) {
        if ((wordChunk + ' ' + word).length > MAX_CHUNK_SIZE) {
          if (wordChunk) {
            chunks.push(wordChunk.trim());
            wordChunk = word;
          } else {
            // Single word is too long, force split
            chunks.push(word.substring(0, MAX_CHUNK_SIZE));
            wordChunk = word.substring(MAX_CHUNK_SIZE);
          }
        } else {
          wordChunk = wordChunk ? wordChunk + ' ' + word : word;
        }
      }
      
      if (wordChunk) {
        currentChunk = wordChunk;
      }
    } else {
      // Check if adding this sentence would exceed the limit
      if ((currentChunk + ' ' + sentence).length > MAX_CHUNK_SIZE) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

async function convertSingleChunk(openai, config, text, chunkIndex, maxRetries = 3) {
  // Show chunk info
  const truncatedText = text.length > 50 
    ? `${text.substring(0, 20)}...${text.substring(text.length - 20)}`
    : text;
  console.log(chalk.gray(`Chunk ${chunkIndex}: "${truncatedText}" (${text.length} chars)`));
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: config.voice,
        input: text,
        response_format: config.audioFormat,
      });

      const tempPath = `${config.output}_chunk_${chunkIndex}.${config.audioFormat}`;
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(tempPath, buffer);
      
      return tempPath;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        console.log(chalk.yellow(`\n⚠️ Chunk ${chunkIndex} failed (attempt ${attempt}/${maxRetries}), retrying...`));
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw lastError;
}

async function mergeAudioFiles(chunkPaths, outputPath, audioFormat) {
  // Create a list file for ffmpeg
  const listContent = chunkPaths.map(path => `file '${path}'`).join('\n');
  const listPath = 'chunks_list.txt';
  await fs.writeFile(listPath, listContent);

  try {
    // Use ffmpeg to concatenate audio files
    const ffmpegCmd = `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}" -y`;
    await execAsync(ffmpegCmd);
    
    // Clean up temporary files
    await fs.unlink(listPath);
    for (const chunkPath of chunkPaths) {
      await fs.unlink(chunkPath);
    }
  } catch (error) {
    // If ffmpeg fails, try a simpler approach or throw error with helpful message
    throw new Error('Failed to merge audio files. Please ensure ffmpeg is installed on your system.');
  }
}

async function convertTextToSpeech(config, text) {
  const spinner = ora('Analyzing text...').start();
  
  try {
    const openai = new OpenAI({
      apiKey: config.apiKey,
    });

    // Check if text needs chunking
    const chunks = chunkText(text);
    const outputPath = `${config.output}.${config.audioFormat}`;
    
    if (chunks.length === 1) {
      // Single chunk processing (original logic)
      spinner.text = 'Converting text to speech...';
      
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: config.voice,
        input: text,
        response_format: config.audioFormat,
      });

      spinner.text = 'Saving audio file...';
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(outputPath, buffer);
    } else {
      // Multi-chunk processing
      spinner.text = `Processing ${chunks.length} chunks...`;
      console.log(chalk.yellow(`\nText is ${text.length} characters long, splitting into ${chunks.length} chunks.`));
      
      const chunkPaths = [];
      
      for (let i = 0; i < chunks.length; i++) {
        spinner.text = `Converting chunk ${i + 1}/${chunks.length}...`;
        
        const chunkPath = await convertSingleChunk(openai, config, chunks[i], i + 1);
        chunkPaths.push(chunkPath);
        
        // Small delay to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      spinner.text = 'Merging audio files...';
      await mergeAudioFiles(chunkPaths, outputPath, config.audioFormat);
    }

    spinner.succeed(`Audio saved to: ${chalk.cyan(outputPath)}`);
    
    // Display file info
    const stats = await fs.stat(outputPath);
    console.log(chalk.gray(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`));
    console.log(chalk.gray(`Voice: ${config.voice}`));
    console.log(chalk.gray(`Format: ${config.audioFormat}`));
    if (chunks.length > 1) {
      console.log(chalk.gray(`Chunks processed: ${chunks.length}`));
    }
    
  } catch (error) {
    spinner.fail('Conversion failed');
    
    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key');
    } else if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded');
    } else if (error.message.includes('rate limit')) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.');
    } else if (error.message.includes('ffmpeg')) {
      throw error; // Re-throw ffmpeg errors as-is
    } else {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.error(chalk.red.bold('❌ Unexpected error:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(chalk.red.bold('❌ Unexpected error:'), error.message);
  process.exit(1);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Operation cancelled by user'));
  process.exit(0);
});

main();
