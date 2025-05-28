## Page: https://platform.openai.com/docs/guides/text-to-speech

Learn how to turn text into lifelike spoken audio.

The Audio API provides a `speech` endpoint based on our GPT-4o mini TTS (text-to-speech) model. It comes with 11 built-in voices and can be used to:

*   Narrate a written blog post
*   Produce spoken audio in multiple languages
*   Give realtime audio output using streaming

Here's an example of the `alloy` voice:

Our usage policies require you to provide a clear disclosure to end users that the TTS voice they are hearing is AI-generated and not a human voice.

## Quickstart

The `speech` endpoint takes three key inputs:

1.  The model you're using
2.  The text to be turned into audio
3.  The voice that will speak the output

Here's a simple request example:

Generate spoken audio from input text

    1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 import fs from "fs"; import path from "path"; import OpenAI from "openai";  const openai = new OpenAI(); const speechFile = path.resolve("./speech.mp3");  const mp3 = await openai.audio.speech.create({  model: "gpt-4o-mini-tts",  voice: "coral",  input: "Today is a wonderful day to build something people love!",  instructions: "Speak in a cheerful and positive tone.", });  const buffer = Buffer.from(await mp3.arrayBuffer()); await fs.promises.writeFile(speechFile, buffer);

    1 2 3 4 5 6 7 8 9 10 11 12 13 from pathlib import Path from openai import OpenAI  client = OpenAI() speech_file_path = Path(__file__).parent / "speech.mp3"  with client.audio.speech.with_streaming_response.create(  model="gpt-4o-mini-tts",  voice="coral",  input="Today is a wonderful day to build something people love!",  instructions="Speak in a cheerful and positive tone.", ) as response:  response.stream_to_file(speech_file_path)

    1 2 3 4 5 6 7 8 9 10 curl https://api.openai.com/v1/audio/speech \  -H "Authorization: Bearer $OPENAI_API_KEY" \  -H "Content-Type: application/json" \  -d '{  "model": "gpt-4o-mini-tts",  "input": "Today is a wonderful day to build something people love!",  "voice": "coral",  "instructions": "Speak in a cheerful and positive tone."  }' \  --output speech.mp3

By default, the endpoint outputs an MP3 of the spoken audio, but you can configure it to output any supported format.

### Text-to-speech models

For intelligent realtime applications, use the `gpt-4o-mini-tts` model, our newest and most reliable text-to-speech model. You can prompt the model to control aspects of speech, including:

*   Accent
*   Emotional range
*   Intonation
*   Impressions
*   Speed of speech
*   Tone
*   Whispering

Our other text-to-speech models are `tts-1` and `tts-1-hd`. The `tts-1` model provides lower latency, but at a lower quality than the `tts-1-hd` model.

### Voice options

The TTS endpoint provides 11 built‑in voices to control how speech is rendered from text. **Hear and play with these voices in OpenAI.fm, our interactive demo for trying the latest text-to-speech model in the OpenAI API**. Voices are currently optimized for English.

*   `alloy`
*   `ash`
*   `ballad`
*   `coral`
*   `echo`
*   `fable`
*   `nova`
*   `onyx`
*   `sage`
*   `shimmer`

If you're using the Realtime API, note that the set of available voices is slightly different—see the realtime conversations guide for current realtime voices.

### Streaming realtime audio

The Speech API provides support for realtime audio streaming using chunk transfer encoding. This means the audio can be played before the full file is generated and made accessible.

Stream spoken audio from input text directly to your speakers

    1 2 3 4 5 6 7 8 9 10 11 12 13 14 import OpenAI from "openai"; import { playAudio } from "openai/helpers/audio";  const openai = new OpenAI();  const response = await openai.audio.speech.create({  model: "gpt-4o-mini-tts",  voice: "coral",  input: "Today is a wonderful day to build something people love!",  instructions: "Speak in a cheerful and positive tone.",  response_format: "wav", });  await playAudio(response);

    1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 import asyncio  from openai import AsyncOpenAI from openai.helpers import LocalAudioPlayer  openai = AsyncOpenAI()  async def main() -> None:  async with openai.audio.speech.with_streaming_response.create(  model="gpt-4o-mini-tts",  voice="coral",  input="Today is a wonderful day to build something people love!",  instructions="Speak in a cheerful and positive tone.",  response_format="pcm",  ) as response:  await LocalAudioPlayer().play(response)  if __name__ == "__main__":  asyncio.run(main())

    1 2 3 4 5 6 7 8 9 10 curl https://api.openai.com/v1/audio/speech \  -H "Authorization: Bearer $OPENAI_API_KEY" \  -H "Content-Type: application/json" \  -d '{  "model": "gpt-4o-mini-tts",  "input": "Today is a wonderful day to build something people love!",  "voice": "coral",  "instructions": "Speak in a cheerful and positive tone.",  "response_format": "wav"  }' | ffplay -i -

For the fastest response times, we recommend using `wav` or `pcm` as the response format.

## Supported output formats

The default response format is `mp3`, but other formats like `opus` and `wav` are available.

*   **MP3**: The default response format for general use cases.
*   **Opus**: For internet streaming and communication, low latency.
*   **AAC**: For digital audio compression, preferred by YouTube, Android, iOS.
*   **FLAC**: For lossless audio compression, favored by audio enthusiasts for archiving.
*   **WAV**: Uncompressed WAV audio, suitable for low-latency applications to avoid decoding overhead.
*   **PCM**: Similar to WAV but contains the raw samples in 24kHz (16-bit signed, low-endian), without the header.

## Supported languages

The TTS model generally follows the Whisper model in terms of language support. Whisper supports the following languages and performs well, despite voices being optimized for English:

Afrikaans, Arabic, Armenian, Azerbaijani, Belarusian, Bosnian, Bulgarian, Catalan, Chinese, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, Galician, German, Greek, Hebrew, Hindi, Hungarian, Icelandic, Indonesian, Italian, Japanese, Kannada, Kazakh, Korean, Latvian, Lithuanian, Macedonian, Malay, Marathi, Maori, Nepali, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swahili, Swedish, Tagalog, Tamil, Thai, Turkish, Ukrainian, Urdu, Vietnamese, and Welsh.

You can generate spoken audio in these languages by providing input text in the language of your choice.

## Customization and ownership

### Custom voices

We do not support custom voices or creating a copy of your own voice.

### Who owns the output?

As with all outputs from our API, the person who created them owns the output. You are still required to inform end users that they are hearing audio generated by AI and not a real person talking to them.