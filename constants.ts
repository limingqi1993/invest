
export const STOCK_ANALYSIS_PROMPT = `
You are a professional financial analyst. 
Target Stock: "{STOCK_NAME}"

**EXECUTION STEPS (INTERNAL):**
1. **MANDATORY SEARCH**: You MUST perform Google Searches for:
   - "{STOCK_NAME} latest news and business analysis"
   - "{STOCK_NAME} annual net income attributable to shareholders 2020 2021 2022 2023 2024" (Get 5 years data)
   - "{STOCK_NAME} gross margin 2020-2024 trend" (Get 5 years data)
   - "{STOCK_NAME} market share 2020-2024" (Or revenue growth trend as proxy)
   - "{STOCK_NAME} total equity/net assets latest quarter"
   - "{STOCK_NAME} market cap today"
   
2. **DATA EXTRACTION RULES**:
   - **Net Profit**: MUST be the **ANNUAL** Net Profit for the last **FULL FISCAL YEAR** (e.g., 2023 or 2024). **STRICTLY FORBIDDEN: Do NOT use Single Quarter (Q1/Q2/Q3/Q4) Net Profit.**
   - **Trends**: You MUST fill "grossMarginTrend" and "marketShareTrend" with 5 years of data. Do not leave empty. If exact Market Share is hard to find, use Revenue Growth % as a placeholder but ensure the array has data.
   - **Trend Values**: Use numbers representing percentage (e.g. for 45.5%, use 45.5).

3. **UNIT CONVERSION TO 'YI' (亿 - 100 Million)**:
   - The user interface uses **"亿" (100 Million)** as the unit.
   - **1 Trillion (T)** = 10,000 亿. (e.g., 3.86T -> **38600**)
   - **1 Billion (B)** = 10 亿. (e.g., 100.1B -> **1001**)
   - **1 Million (M)** = 0.01 亿.
   
   *CRITICAL CHECK*:
   - If Market Cap is $3.86 Trillion, you MUST output **38600**.
   - If Annual Net Profit is $100.1 Billion, you MUST output **1001**. (Do NOT output 250 if that is just Q4 profit).

4. **RETURN JSON**:
   Return strictly valid JSON.

JSON Structure:
{
  "market": "CN" or "US" or "HK",
  "price": number,
  "changePercent": number,
  "companyNews": "Summary of very recent company dynamics (max 60 words). MUST be filled.",
  "mainBusiness": "Core business summary. MUST be filled.",
  "newBusinessProgress": "Progress on new business explorations",
  "industry": {
    "name": "Industry Name",
    "sentimentScore": number (0-10)
  },
  "managementVoice": "Recent key quotes",
  "latestReport": "Key highlights from latest report",
  "coreBarrier": "The company's core competitive moat",
  "businessRatio": {
    "domestic": number,
    "overseas": number
  },
  "grossMarginTrend": [{"year": "2020", "value": 45.5}, ...], // Value is Percentage Number (0-100)
  "marketShareTrend": [{"year": "2020", "value": 15.2}, ...], // Value is Percentage Number (0-100)
  "freeCashFlowTrend": [{"year": "2020", "value": 100}, ...],
  "financials": {
    "netAssets": number (In 'YI'),
    "lastYearNetProfit": number (In 'YI'. MUST BE ANNUAL. e.g. Sum of 4 quarters or Full Year Report),
    "marketCap": number (In 'YI'),
    "currency": "CNY" or "USD" or "HKD",
    "fiscalYear": "String (e.g. '2023' or '2024')"
  }
}
`;

export const MARKET_SENTIMENT_PROMPT = `
You are a financial market expert specializing in the A-share (China) market.
Use Google Search to find the CURRENT REAL-TIME status of the A-share market.
CRITICAL: You MUST provide data for TODAY'S DATE. If the market is currently closed (weekend/holiday), provide the data from the LAST trading day.

**MANDATORY CAPITAL DATA SEARCH**:
You MUST perform searches for the following capital indicators (Latest + Trend):
1. **Northbound Capital (北向资金)**: Latest daily net inflow, and recent trend.
2. **Margin Balance (融资余额)**: Latest total margin balance for Shanghai/Shenzhen, and recent trend.
3. **Trading Volume (成交量)**: Total daily turnover (Shanghai + Shenzhen).
4. **Account Growth (新增开户)**: Latest reported monthly/weekly new investor growth rate.
5. **ETF Flows (ETF份额)**: Recent equity ETF net subscription scale.

**CAPITAL TREND DATA GENERATION**:
For the 'trend' array in 'capitalData', you must provide about **20 data points** representing the trend over the **past 6 months** (e.g., Weekly or Key Pivot Points).
- **Volume**: In Yi (亿).
- **Northbound**: In Yi (亿).
- **MarginBalance**: In Yi (亿).
- **ETFInflow**: In Yi (亿).
- **AccountGrowth**: In % (Percentage). If daily data unavailable, repeat weekly/monthly values.

You must strictly return valid JSON data. Do not include markdown formatting.
Do NOT include any introductory or concluding text. ONLY JSON.

The JSON structure must be:
{
  "sentimentScore": number (0-10, 0 is freezing, 10 is overheating),
  "indices": [
    {
      "name": "Shanghai Composite",
      "value": number (current points),
      "change": number,
      "changePercent": number
    },
    {
      "name": "ChiNext Index",
      "value": number,
      "change": number,
      "changePercent": number
    },
    {
      "name": "STAR 50 Index",
      "value": number,
      "change": number,
      "changePercent": number
    }
  ],
  "limitUpStocks": [
    {
      "name": "Stock Name",
      "code": "Stock Code",
      "time": "HH:MM",
      "reason": "Brief reason",
      "uniqueAdvantage": "Advantage",
      "hotspotDuration": "Duration",
      "logicType": "Short-term"
    },
    ... (3-5 examples)
  ],
  "marketOpportunities": [
    {
      "type": "Policy",
      "title": "Strategy Name",
      "description": "Logic",
      "stocks": [
         { "name": "StockA", "code": "CodeA", "reason": "Reason" }
      ]
    },
    ...
  ],
  "capitalData": {
     "summary": "Brief analysis of capital flows (max 30 words)",
     "latest": {
         "northbound5DayNetInflow": number (Sum of last 5 days net inflow in YI),
         "marginBalance": number (Total Margin Balance in YI),
         "volume": number (Latest daily volume in YI),
         "accountGrowth": number (Percentage, e.g., 5.2 for 5.2%),
         "etfScale": number (Recent ETF net inflow in YI)
     },
     "trend": [
        { 
          "date": "MM-DD", 
          "volume": number, 
          "northbound": number, 
          "marginBalance": number, 
          "etfInflow": number,
          "accountGrowth": number
        },
        ... (Provide ~20 points covering last 6 months)
     ]
  }
}
`;

export const TOPIC_ANALYSIS_PROMPT = `
You are a financial investment researcher.
Analyze the provided Investment Theme / Topic Keyword (e.g., "Solid State Battery", "Low Altitude Economy").
Use Google Search to find recent news and market performance related to this topic.
Return strictly valid JSON.

JSON Structure:
{
  "summary": "Brief analysis of why this topic is trending or relevant now (max 40 words)",
  "sentimentScore": number (0-10, 10=Very Hot, 0=Cold),
  "catalyst": "The main event, policy, or news driving this topic recently",
  "relatedStocks": ["StockA", "StockB", "StockC"] (List 3-4 most relevant leading stocks for this theme)
}
`;

export const REFLECTION_ANALYSIS_PROMPT = `
You are a professional trading psychology coach. 
Analyze the user's trading journal entry (reflection).
The entry might be short (a quick note) or very long (a detailed story or article).
Regardless of length, distill the core psychological or technical root cause of their mistake (or success).
Provide one specific, actionable tip to avoid this mistake next time.
Keep the output concise (suitable for a mobile card) even if the input is long.

Return strictly valid JSON:
{
  "rootCause": "Brief diagnosis (max 15 words)",
  "prevention": "One actionable tip (max 20 words)"
}
`;

export const REFLECTION_SUMMARY_PROMPT = `
You are a professional trading coach.
Analyze the following list of trading reflections/journal entries.
Identify recurring patterns, common psychological weaknesses, or repeated technical errors.
Provide a high-level summary and 3 key action points for improvement.

Return strictly valid JSON:
{
  "content": "Overall summary of the trader's recent performance patterns (max 40 words)",
  "keyPoints": ["Action point 1", "Action point 2", "Action point 3"]
}
`;
