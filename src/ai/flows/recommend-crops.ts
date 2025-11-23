
'use server';

/**
 * @fileOverview Crop recommendation flow.
 *
 * - recommendCrops - Recommends crops based on soil type, climate, and season.
 * - RecommendCropsInput - The input type for the recommendCrops function.
 * - RecommendCropsOutput - The return type for the recommendCrops function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendCropsInputSchema = z.object({
  soilType: z.string().describe('The type of soil (e.g., "clay", "sandy", "loamy").'),
  climate: z.string().describe('The climate conditions (e.g., "tropical", "temperate", "arid").'),
  season: z.string().describe('The growing season (e.g., "kharif", "rabi", "zaid").'),
  language: z.string().describe('The language for the response (e.g., "en", "hi", "kn", "bn", "bho").'),
});
export type RecommendCropsInput = z.infer<typeof RecommendCropsInputSchema>;

const RecommendCropsOutputSchema = z.object({
  recommendedCrops: z.array(z.string()).describe('A list of recommended crops for the given conditions.'),
  explanation: z.string().describe('An explanation of why these crops are recommended.'),
});
export type RecommendCropsOutput = z.infer<typeof RecommendCropsOutputSchema>;

const recommendCropsPrompt = ai.definePrompt({
  name: 'recommendCropsPrompt',
  input: {
    schema: z.object({
      soilType: z.string(),
      climate: z.string(),
      season: z.string(),
      language: z.string(),
    }),
  },
  output: {schema: RecommendCropsOutputSchema},
  prompt: `You are an agricultural expert providing crop recommendations to farmers in India.

  The farmer's preferred language is {{language}}. All of your text output (recommendedCrops, explanation) MUST be in this language.

  Based on the following conditions, recommend suitable crops:
  - Soil Type: {{soilType}}
  - Climate: {{climate}}
  - Season: {{season}}

  Provide:
  1. A list of 3-5 recommended crops suitable for these conditions
  2. A brief explanation of why these crops are recommended

  Make your response practical and actionable for farmers. If the requested language is Hindi, the response should be entirely in Hindi.
  If it's Kannada, respond in Kannada. If it's Bengali, respond in Bengali.`,
});

export async function recommendCrops(input: RecommendCropsInput): Promise<RecommendCropsOutput> {
  return recommendCropsFlow(input);
}

const recommendCropsFlow = ai.defineFlow(
  {
    name: 'recommendCropsFlow',
    inputSchema: RecommendCropsInputSchema,
    outputSchema: RecommendCropsOutputSchema,
  },
  async input => {
    try {
      // Check if AI is available (has valid API key)
      if (!process.env.GOOGLE_GENAI_API_KEY) {
        console.log('AI model not available, using fallback recommendations');
        return getFallbackRecommendations(input);
      }

      const {output} = await recommendCropsPrompt(input);   
      return output!;
    } catch (error) {
      console.error("Error in recommendCropsFlow, returning fallback.", error);
      return getFallbackRecommendations(input);
    }
  }
);

// Fallback recommendations when AI is not available
function getFallbackRecommendations(input: RecommendCropsInput): RecommendCropsOutput {
  const { soilType, climate, season, language } = input;
  
  const fallbackData = {
    en: {
      clay: {
        tropical: {
          kharif: ['Rice', 'Maize', 'Cotton'],
          rabi: ['Wheat', 'Mustard', 'Chickpea'],
          zaid: ['Vegetables', 'Pulses', 'Oilseeds']
        },
        temperate: {
          kharif: ['Maize', 'Soybean', 'Sunflower'],
          rabi: ['Wheat', 'Barley', 'Peas'],
          zaid: ['Vegetables', 'Herbs', 'Legumes']
        },
        arid: {
          kharif: ['Pearl Millet', 'Sorghum', 'Groundnut'],
          rabi: ['Wheat', 'Chickpea', 'Mustard'],
          zaid: ['Vegetables', 'Pulses', 'Oilseeds']
        }
      },
      sandy: {
        tropical: {
          kharif: ['Groundnut', 'Pearl Millet', 'Pulses'],
          rabi: ['Wheat', 'Chickpea', 'Mustard'],
          zaid: ['Vegetables', 'Oilseeds', 'Legumes']
        },
        temperate: {
          kharif: ['Soybean', 'Sunflower', 'Pulses'],
          rabi: ['Wheat', 'Barley', 'Peas'],
          zaid: ['Vegetables', 'Herbs', 'Legumes']
        },
        arid: {
          kharif: ['Pearl Millet', 'Sorghum', 'Groundnut'],
          rabi: ['Wheat', 'Chickpea', 'Mustard'],
          zaid: ['Vegetables', 'Pulses', 'Oilseeds']
        }
      },
      loamy: {
        tropical: {
          kharif: ['Rice', 'Maize', 'Cotton', 'Sugarcane'],
          rabi: ['Wheat', 'Mustard', 'Chickpea', 'Barley'],
          zaid: ['Vegetables', 'Pulses', 'Oilseeds', 'Fruits']
        },
        temperate: {
          kharif: ['Maize', 'Soybean', 'Sunflower', 'Pulses'],
          rabi: ['Wheat', 'Barley', 'Peas', 'Oats'],
          zaid: ['Vegetables', 'Herbs', 'Legumes', 'Fruits']
        },
        arid: {
          kharif: ['Pearl Millet', 'Sorghum', 'Groundnut', 'Pulses'],
          rabi: ['Wheat', 'Chickpea', 'Mustard', 'Barley'],
          zaid: ['Vegetables', 'Pulses', 'Oilseeds', 'Fruits']
        }
      }
    },
    hi: {
      clay: {
        tropical: {
          kharif: ['धान', 'मक्का', 'कपास'],
          rabi: ['गेहूं', 'सरसों', 'चना'],
          zaid: ['सब्जियां', 'दालें', 'तिलहन']
        },
        temperate: {
          kharif: ['मक्का', 'सोयाबीन', 'सूरजमुखी'],
          rabi: ['गेहूं', 'जौ', 'मटर'],
          zaid: ['सब्जियां', 'जड़ी-बूटियां', 'फलियां']
        },
        arid: {
          kharif: ['बाजरा', 'ज्वार', 'मूंगफली'],
          rabi: ['गेहूं', 'चना', 'सरसों'],
          zaid: ['सब्जियां', 'दालें', 'तिलहन']
        }
      },
      sandy: {
        tropical: {
          kharif: ['मूंगफली', 'बाजरा', 'दालें'],
          rabi: ['गेहूं', 'चना', 'सरसों'],
          zaid: ['सब्जियां', 'तिलहन', 'फलियां']
        },
        temperate: {
          kharif: ['सोयाबीन', 'सूरजमुखी', 'दालें'],
          rabi: ['गेहूं', 'जौ', 'मटर'],
          zaid: ['सब्जियां', 'जड़ी-बूटियां', 'फलियां']
        },
        arid: {
          kharif: ['बाजरा', 'ज्वार', 'मूंगफली'],
          rabi: ['गेहूं', 'चना', 'सरसों'],
          zaid: ['सब्जियां', 'दालें', 'तिलहन']
        }
      },
      loamy: {
        tropical: {
          kharif: ['धान', 'मक्का', 'कपास', 'गन्ना'],
          rabi: ['गेहूं', 'सरसों', 'चना', 'जौ'],
          zaid: ['सब्जियां', 'दालें', 'तिलहन', 'फल']
        },
        temperate: {
          kharif: ['मक्का', 'सोयाबीन', 'सूरजमुखी', 'दालें'],
          rabi: ['गेहूं', 'जौ', 'मटर', 'जई'],
          zaid: ['सब्जियां', 'जड़ी-बूटियां', 'फलियां', 'फल']
        },
        arid: {
          kharif: ['बाजरा', 'ज्वार', 'मूंगफली', 'दालें'],
          rabi: ['गेहूं', 'चना', 'सरसों', 'जौ'],
          zaid: ['सब्जियां', 'दालें', 'तिलहन', 'फल']
        }
      }
    }
  };

  // Get recommendations based on input
  const recommendations = fallbackData[language as keyof typeof fallbackData] || fallbackData.en;
  const soilRecs = recommendations[soilType as keyof typeof recommendations];
  const climateRecs = soilRecs?.[climate as keyof typeof soilRecs];
  const seasonRecs = climateRecs?.[season as keyof typeof climateRecs] || ['Wheat', 'Rice', 'Maize'];

  const explanations = {
    en: `Based on your ${soilType} soil, ${climate} climate, and ${season} season, these crops are recommended for optimal growth and yield.`,
    hi: `आपकी ${soilType} मिट्टी, ${climate} जलवायु, और ${season} मौसम के आधार पर, इन फसलों की सिफारिश की जाती है जो इष्टतम विकास और उपज के लिए उपयुक्त हैं।`
  };

  return {
    recommendedCrops: seasonRecs,
    explanation: explanations[language as keyof typeof explanations] || explanations.en
  };
}
