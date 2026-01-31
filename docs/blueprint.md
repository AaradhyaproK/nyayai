# **App Name**: Nyaya Mitra

## Core Features:

- Document Summarization: Summarize legal documents using the Gemini API, presenting key information concisely. The LLM will act as a tool that might incorporate relevant pieces of legal knowledge in its summary based on the specific type of document being analyzed.
- AI Judge: Simulate court outcomes using AI based on provided case details and legal precedents; results are for informational purposes only. The LLM will act as a tool and leverage case details when assessing probability.
- Multilingual Voice Chatbot: Provide legal assistance and information through a multilingual voice chatbot powered by Gemini API. Users will be able to switch language and communicate directly through voice or chat. The chatbot can answer questions on legal topics.
- Case Study Helper: Provide access to relevant case studies. Uses Firestore for database operations.
- Lawyer Recommendation: Recommend lawyers based on user needs. Uses Firestore for database operations.
- Role-Based Login: Implement secure role-based login for users, lawyers (vakil), and judges.
- Court Statistics Dashboard: Visualize court statistics using a dashboard interface. Uses Firestore for database operations.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to convey trust and professionalism, drawing inspiration from the established visual language of legal documents.
- Background color: Light gray (#ECEFF1) to ensure readability and reduce eye strain during extended use.
- Accent color: Subtle green (#4CAF50) for highlighting key information and calls to action, creating a balance between serious and inviting.
- Body font: 'PT Sans', a humanist sans-serif that is highly readable for body text.
- Headline font: 'Space Grotesk', a proportional sans-serif which conveys precision. Use for headers only; 'PT Sans' for body text.
- Use simple, modern icons to represent different legal modules and actions.
- Implement a clean, intuitive layout with clear navigation and a focus on accessibility.
- Use subtle transitions and animations to provide feedback and guide users through the app.