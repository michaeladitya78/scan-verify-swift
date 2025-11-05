// Genkit setup (not imported elsewhere; safe for bundlers)
// Usage (Node/runtime only): provide GOOGLE_GENAI_API_KEY in env.
import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';

export const ai = genkit({
	plugins: [googleAI()],
	model: gemini15Flash,
});

export async function helloFlow(name: string): Promise<string> {
	const { text } = await ai.generate(`Hello Gemini, my name is ${name}`);
	return text ?? '';
}


