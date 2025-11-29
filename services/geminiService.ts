
import { GoogleGenAI } from "@google/genai";
import { STOCK_ANALYSIS_PROMPT, MARKET_SENTIMENT_PROMPT, TOPIC_ANALYSIS_PROMPT, REFLECTION_ANALYSIS_PROMPT, REFLECTION_SUMMARY_PROMPT } from "../constants";
import { StockData, MarketData, TopicData, Language, AIAnalysis, ReflectionSummary } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to parse JSON cleaner
const parseJSON = (text: string) => {
  if (!text) return null;
  try {
    // 1. Try removing code blocks first
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    // 2. Try parsing
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("Direct JSON parse failed, trying regex extraction", e);
    // 3. Fallback: Extract the first curly brace group found
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e2) {
        console.error("Regex JSON extraction failed", e2);
    }
    throw new Error("Failed to parse AI response as JSON");
  }
};

export const fetchStockAnalysis = async (stockName: string, lang: Language): Promise<Omit<StockData, 'id' | 'name' | 'lastUpdated' | 'category'>> => {
  try {
    const langInstruction = lang === 'en' ? "Please generate all text content in English." : "Please generate all text content in Chinese (Simplified).";
    
    // Inject the stock name into the prompt to ensure specific searches
    const prompt = STOCK_ANALYSIS_PROMPT.replace(/\{STOCK_NAME\}/g, stockName);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${prompt}\n${langInstruction}`,
      config: {
        tools: [{ googleSearch: {} }] 
      }
    });
    
    const text = response.text;
    const data = parseJSON(text);
    if (!data) throw new Error("Empty data received");
    return data;
  } catch (error) {
    console.error("Gemini Stock Analysis Error:", error);
    throw error;
  }
};

export const fetchMarketSentiment = async (lang: Language): Promise<MarketData> => {
  try {
    const langInstruction = lang === 'en' ? "Please generate all text content in English." : "Please generate all text content in Chinese (Simplified).";
    const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${MARKET_SENTIMENT_PROMPT}\nTODAY IS: ${today}\n${langInstruction}`,
      config: {
        tools: [{ googleSearch: {} }] 
      }
    });

    const text = response.text;
    const data = parseJSON(text);
    
    // Validation: Ensure structure exists
    if (!data || !data.indices) {
        throw new Error("Invalid market data structure");
    }

    return {
      ...data,
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error("Gemini Market Sentiment Error:", error);
    // Return a fallback to prevent app crash and infinite loading loops
    return {
      sentimentScore: 5.0,
      limitUpStocks: [],
      marketOpportunities: [],
      indices: [
        { name: "Shanghai Composite", value: 0, change: 0, changePercent: 0 },
        { name: "ChiNext", value: 0, change: 0, changePercent: 0 },
        { name: "STAR 50", value: 0, change: 0, changePercent: 0 }
      ],
      lastUpdated: Date.now()
    };
  }
};

export const fetchTopicAnalysis = async (keyword: string, lang: Language): Promise<Omit<TopicData, 'id' | 'keyword' | 'lastUpdated'>> => {
  try {
     const langInstruction = lang === 'en' ? "Please generate all text content in English." : "Please generate all text content in Chinese (Simplified).";
     
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${TOPIC_ANALYSIS_PROMPT}\n${langInstruction}\nTarget Topic: ${keyword}`,
      config: {
        tools: [{ googleSearch: {} }] 
      }
    });

    const text = response.text;
    const data = parseJSON(text);
    if (!data) throw new Error("Empty topic data");
    return data;
  } catch (error) {
    console.error("Gemini Topic Analysis Error:", error);
    throw error;
  }
};

export const analyzeTradeReflection = async (noteContent: string, lang: Language): Promise<AIAnalysis> => {
    try {
        const langInstruction = lang === 'en' ? "Please generate all text content in English." : "Please generate all text content in Chinese (Simplified).";
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${REFLECTION_ANALYSIS_PROMPT}\n${langInstruction}\nUser Note: "${noteContent}"`
        });
        const text = response.text;
        const data = parseJSON(text);
        if(!data) throw new Error("Empty analysis");
        return data;
    } catch (error) {
        console.error("Reflection Analysis Error", error);
        throw error;
    }
};

export const generateTradeSummary = async (notes: string[], lang: Language): Promise<ReflectionSummary> => {
    try {
        const langInstruction = lang === 'en' ? "Please generate all text content in English." : "Please generate all text content in Chinese (Simplified).";
        const notesText = notes.map((n, i) => `${i+1}. ${n}`).join('\n');
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${REFLECTION_SUMMARY_PROMPT}\n${langInstruction}\nUser Notes:\n${notesText}`
        });
        
        const text = response.text;
        const data = parseJSON(text);
        if(!data) throw new Error("Empty summary");
        
        return {
            content: data.content,
            keyPoints: data.keyPoints,
            generatedAt: Date.now()
        };
    } catch (error) {
        console.error("Reflection Summary Error", error);
        throw error;
    }
};
