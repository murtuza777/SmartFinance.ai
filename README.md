# **SmartFinance.AI**  
### *AI-Powered Student Finance Management*  

SmartFinance.AI is an intelligent financial management platform designed specifically for students, leveraging AI to provide personalized financial guidance, loan management, and expense optimization.

---

## 🌟 **Key Features**

### **1. AI Financial Advisor**
- Personalized financial health analysis  
- Smart spending recommendations  
- Foreign country cost-of-living adjustments  
- Loan repayment optimization  
- Government grants and aid suggestions  
- Investment opportunities (stocks, crypto)  
- Extra earning recommendations  

### **2. Financial Timelines**
- Comprehensive cash flow visualization  
- Loan payment deadline tracking  
- Income stream monitoring  
- Expense tracking  
- Investment return projections  

### **3. Cost Cutter**
- AI-powered expense optimization  
- Unnecessary cost identification  
- Smart budgeting recommendations  
- Location-based cost analysis  

### **4. Financial Insights**
- Interactive data visualizations  
- Cash flow analytics  
- Expense pattern analysis  
- Savings projections  
- Risk assessment metrics  

---

## 🛠️ **Technology Stack**

### **Frontend**
- **Next.js 14** (App Router)  
- **TypeScript**  
- **Tailwind CSS**  
- **Framer Motion**  
- **Three.js** (3D visualizations)  
- **Chart.js** (Data visualization)  

### **Backend**
- **Cloudflare Workers**  
- **Vector Database** (Cloudflare Vectorize)  
- **KV Storage**  
- **Firebase** (Auth & Firestore)  

### **AI/ML**
- **RAG** (Retrieval-Augmented Generation)  
- **Google Gemini 2.5 Pro** (AI Financial Advisor - Primary model)
- **Cloudflare AI Models**:
  - `@cf/meta/llama-2-7b-chat-int8` (Financial advice)  
  - `@cf/baai/bge-base-en-v1.5` (Embeddings)  

---

## 🏗️ **System Architecture**

### **High-Level System Design**

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Next.js Frontend]
        THR[Three.js Rendering]
        VIZ[Data Visualization]
    end
    subgraph "Edge Computing Layer"
        CF[Cloudflare Workers]
        AI[Cloudflare AI]
        VDB[(Vectorize DB)]
        KV[(KV Storage)]
    end
    subgraph "Authentication Layer"
        FA[Firebase Auth]
        FS[(Firestore)]
    end
    UI --> CF
    THR --> UI
    VIZ --> UI
    CF --> AI
    CF --> VDB
    CF --> KV
    CF --> FA
```

### **RAG Implementation Flow**

```mermaid
sequenceDiagram
    participant U as User
    participant W as Worker
    participant V as Vectorize
    participant KV as KV Store
    participant LLM as LLaMA-2
    U->>W: Financial Query
    W->>V: Search Similar Cases
    V-->>W: Return Matches
    W->>KV: Fetch Context Data
    W->>LLM: Generate Response
    LLM-->>W: Financial Advice
    W-->>U: Formatted Response
```

### **Data Processing Pipeline**

```mermaid
graph LR
    subgraph "Data Sources"
        FD[Financial Data]
        SD[Scholarship Data]
        ID[Investment Data]
    end
    subgraph "Processing"
        EMB[Embeddings]
        VEC[Vector Storage]
        CTX[Context Builder]
    end
    subgraph "Retrieval"
        QP[Query Processing]
        VS[Vector Search]
        RA[Response Assembly]
    end
    FD & SD & ID --> EMB
    EMB --> VEC
    VEC --> VS
    VS --> CTX
    CTX --> RA
```

### **Component Architecture**

```mermaid
graph TB
    subgraph "Frontend Components"
        DC[Dashboard]
        AA[AI Advisor]
        CC[Cost Cutter]
        TL[Timeline]
    end
    subgraph "Edge Services"
        AIS[AI Service]
        VS[Vector Search]
        KVS[KV Storage]
    end
    DC --> AIS
    AA --> AIS
    CC --> AIS
    TL --> AIS
    AIS --> VS
    AIS --> KVS
```

---

## 🚀 **Deployment**

### **Prerequisites**
- Node.js 18+
- Cloudflare Account
- Firebase Account
- Environment Variables Setup

### **Local Development**
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### **Environment Variables**
Create a `.env.local` file in the project root with:
```bash
# Google Gemini API Key (Required for AI Advisor)
# Get your API key from: https://ai.google.dev/
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Cloudflare API Token (for Workers deployment)
CLOUDFLARE_API_TOKEN=your_token

# Firebase Configuration
FIREBASE_CONFIG=your_config

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API Key for Workers (if needed)
NEXT_PUBLIC_API_KEY=your_api_key_here
```

#### **Setting up Gemini API Key**
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click **"Get API Key"** to create a new API key
4. Copy your API key
5. Add it to your `.env.local` file as `NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here`
6. Restart your development server

**Note:** The `.env.local` file is already in `.gitignore` and will not be committed to the repository.

### **Production Deployment**
1. Fork this repository
2. Configure environment variables in Cloudflare Dashboard
3. Deploy using Cloudflare Pages:
```bash
npm run deploy
```

---

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

---

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- Cloudflare for their AI and edge computing platform
- Firebase for authentication and database services
- The open-source community for inspiration and tools
