export interface DocSection {
  id: string;
  title: string;
  content: string;
  subsections?: DocSection[];
  tags?: string[];
  lastUpdated: Date;
}

export interface DocPage {
  id: string;
  title: string;
  description: string;
  sections: DocSection[];
  category: string;
  tags: string[];
  lastUpdated: Date;
}

export interface DocSearchResult {
  pageId: string;
  pageTitle: string;
  sectionId: string;
  sectionTitle: string;
  content: string;
  relevance: number;
}

class DocumentationManager {
  private pages: Map<string, DocPage> = new Map();
  private searchIndex: Map<string, DocSearchResult[]> = new Map();

  constructor() {
    this.initializeDocumentation();
  }

  private initializeDocumentation(): void {
    // Add default documentation pages
    this.addPage({
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn how to get started with the Zen Store platform',
      category: 'guide',
      tags: ['beginner', 'setup', 'installation'],
      lastUpdated: new Date(),
      sections: [
        {
          id: 'introduction',
          title: 'Introduction',
          content: `
# Introduction to Zen Store

Zen Store is a modern gaming platform built with Next.js frontend and NestJS backend. 
It provides a comprehensive solution for managing games, packages, and user interactions.

## Features

- 🎮 Gaming dashboard with dynamic content
- 📦 Package management system
- 🏷️ Category organization
- 🔐 Authentication system
- 📱 Responsive design
- ⚡ Real-time data from backend

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: NestJS, MongoDB, JWT Authentication
- **Deployment**: Vercel, Docker
          `,
          lastUpdated: new Date()
        },
        {
          id: 'installation',
          title: 'Installation',
          content: `
# Installation Guide

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (for backend)

## Backend Setup

1. Navigate to the backend directory:
\`\`\`bash
cd backend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a \`.env\` file with your configuration:
\`\`\`env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
\`\`\`

4. Start the backend server:
\`\`\`bash
npm run start:dev
\`\`\`

## Frontend Setup

1. Navigate to the project root:
\`\`\`bash
cd zen_test
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a \`.env.local\` file:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3000
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`
          `,
          lastUpdated: new Date()
        }
      ]
    });

    this.addPage({
      id: 'api-reference',
      title: 'API Reference',
      description: 'Complete API documentation for the Zen Store backend',
      category: 'reference',
      tags: ['api', 'endpoints', 'backend'],
      lastUpdated: new Date(),
      sections: [
        {
          id: 'authentication',
          title: 'Authentication',
          content: `
# Authentication

The API uses JWT (JSON Web Tokens) for authentication.

## Login

\`\`\`http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

## Response

\`\`\`json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
\`\`\`

## Using the Token

Include the token in the Authorization header:

\`\`\`http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`
          `,
          lastUpdated: new Date()
        },
        {
          id: 'games',
          title: 'Games API',
          content: `
# Games API

## Get All Games

\`\`\`http
GET /game?limit=10&page=1&category=mobile
\`\`\`

## Get Game by ID

\`\`\`http
GET /game/{gameId}
\`\`\`

## Response Format

\`\`\`json
{
  "success": true,
  "data": [
    {
      "_id": "game_id",
      "name": "Game Name",
      "image": "image_url",
      "description": "Game description",
      "price": 9.99,
      "category": "mobile",
      "isPopular": true,
      "offer": "25% OFF"
    }
  ]
}
\`\`\`
          `,
          lastUpdated: new Date()
        },
        {
          id: 'packages',
          title: 'Packages API',
          content: `
# Packages API

## Get All Packages

\`\`\`http
GET /packages?limit=10&page=1&category=premium
\`\`\`

## Get Package by ID

\`\`\`http
GET /packages/{packageId}
\`\`\`

## Response Format

\`\`\`json
{
  "success": true,
  "data": [
    {
      "_id": "package_id",
      "name": "Package Name",
      "image": "image_url",
      "description": "Package description",
      "price": 19.99,
      "category": "premium",
      "isPopular": true,
      "offer": "Bônus Extra"
    }
  ]
}
\`\`\`
          `,
          lastUpdated: new Date()
        }
      ]
    });

    this.addPage({
      id: 'components',
      title: 'Components',
      description: 'UI components documentation and usage examples',
      category: 'reference',
      tags: ['components', 'ui', 'frontend'],
      lastUpdated: new Date(),
      sections: [
        {
          id: 'loading-spinner',
          title: 'LoadingSpinner',
          content: `
# LoadingSpinner Component

A reusable loading spinner component with customizable size and color.

## Usage

\`\`\`tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';

function MyComponent() {
  return (
    <LoadingSpinner 
      size="lg" 
      color="border-green-500"
      text="Loading data..." 
    />
  );
}
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | 'sm' \| 'md' \| 'lg' | 'md' | Size of the spinner |
| color | string | 'border-green-500' | Color of the spinner |
| text | string | 'Loading...' | Text to display below spinner |
          `,
          lastUpdated: new Date()
        },
        {
          id: 'error-message',
          title: 'ErrorMessage',
          content: `
# ErrorMessage Component

A component for displaying error messages with retry functionality.

## Usage

\`\`\`tsx
import { ErrorMessage } from '@/components/ui/error-message';

function MyComponent() {
  return (
    <ErrorMessage 
      message="Failed to load data" 
      onRetry={() => retryLoad()} 
    />
  );
}
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| message | string | - | Error message to display |
| onRetry | () => void | - | Function to call when retry is clicked |
| className | string | '' | Additional CSS classes |
          `,
          lastUpdated: new Date()
        }
      ]
    });

    // Build search index
    this.buildSearchIndex();
  }

  // Add a documentation page
  addPage(page: DocPage): void {
    this.pages.set(page.id, page);
    this.buildSearchIndex();
  }

  // Get a documentation page
  getPage(pageId: string): DocPage | null {
    return this.pages.get(pageId) || null;
  }

  // Get all pages
  getAllPages(): DocPage[] {
    return Array.from(this.pages.values());
  }

  // Get pages by category
  getPagesByCategory(category: string): DocPage[] {
    return Array.from(this.pages.values()).filter(page => page.category === category);
  }

  // Get pages by tag
  getPagesByTag(tag: string): DocPage[] {
    return Array.from(this.pages.values()).filter(page => page.tags.includes(tag));
  }

  // Search documentation
  search(query: string): DocSearchResult[] {
    const results: DocSearchResult[] = [];
    const searchTerms = query.toLowerCase().split(' ');

    this.pages.forEach(page => {
      page.sections.forEach(section => {
        const content = `${page.title} ${page.description} ${section.title} ${section.content}`.toLowerCase();
        const relevance = searchTerms.reduce((score, term) => {
          const matches = (content.match(new RegExp(term, 'g')) || []).length;
          return score + matches;
        }, 0);

        if (relevance > 0) {
          results.push({
            pageId: page.id,
            pageTitle: page.title,
            sectionId: section.id,
            sectionTitle: section.title,
            content: section.content.substring(0, 200) + '...',
            relevance
          });
        }
      });
    });

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  // Build search index
  private buildSearchIndex(): void {
    this.searchIndex.clear();
    
    this.pages.forEach(page => {
      const pageResults: DocSearchResult[] = [];
      
      page.sections.forEach(section => {
        const content = `${page.title} ${page.description} ${section.title} ${section.content}`;
        const words = content.toLowerCase().split(/\s+/);
        
        words.forEach(word => {
          if (word.length > 2) {
            if (!this.searchIndex.has(word)) {
              this.searchIndex.set(word, []);
            }
            
            const existing = this.searchIndex.get(word)!.find(
              result => result.pageId === page.id && result.sectionId === section.id
            );
            
            if (!existing) {
              this.searchIndex.get(word)!.push({
                pageId: page.id,
                pageTitle: page.title,
                sectionId: section.id,
                sectionTitle: section.title,
                content: section.content.substring(0, 200) + '...',
                relevance: 1
              });
            }
          }
        });
      });
    });
  }

  // Generate documentation site
  generateDocumentationSite(): string {
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zen Store Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .sidebar { width: 250px; float: left; }
        .content { margin-left: 270px; }
        .page { margin-bottom: 40px; }
        .section { margin-bottom: 20px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="sidebar">
        <h2>Documentation</h2>
        <ul>
    `;

    this.pages.forEach(page => {
      html += `<li><a href="#${page.id}">${page.title}</a></li>`;
    });

    html += `
        </ul>
    </div>
    <div class="content">
    `;

    this.pages.forEach(page => {
      html += `
        <div class="page" id="${page.id}">
            <h1>${page.title}</h1>
            <p>${page.description}</p>
      `;

      page.sections.forEach(section => {
        html += `
            <div class="section" id="${section.id}">
                <h2>${section.title}</h2>
                <div>${this.markdownToHTML(section.content)}</div>
            </div>
        `;
      });

      html += `</div>`;
    });

    html += `
    </div>
</body>
</html>
    `;

    return html;
  }

  // Convert markdown to HTML (simple implementation)
  private markdownToHTML(markdown: string): string {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`(.*)`/gim, '<code>$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>')
      .replace(/\n/gim, '<br>');
  }

  // Export documentation as JSON
  exportAsJSON(): string {
    return JSON.stringify(Array.from(this.pages.values()), null, 2);
  }

  // Import documentation from JSON
  importFromJSON(json: string): void {
    try {
      const pages = JSON.parse(json) as DocPage[];
      pages.forEach(page => this.addPage(page));
    } catch (error) {
      console.error('Failed to import documentation:', error);
    }
  }

  // Get documentation statistics
  getDocumentationStats(): {
    totalPages: number;
    totalSections: number;
    categories: Record<string, number>;
    tags: Record<string, number>;
  } {
    const categories: Record<string, number> = {};
    const tags: Record<string, number> = {};
    let totalSections = 0;

    this.pages.forEach(page => {
      categories[page.category] = (categories[page.category] || 0) + 1;
      totalSections += page.sections.length;
      
      page.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    });

    return {
      totalPages: this.pages.size,
      totalSections,
      categories,
      tags
    };
  }
}

export const documentationManager = new DocumentationManager();

// Export documentation utilities
export const addDocPage = documentationManager.addPage.bind(documentationManager);
export const getDocPage = documentationManager.getPage.bind(documentationManager);
export const searchDocs = documentationManager.search.bind(documentationManager);
export const generateDocSite = documentationManager.generateDocumentationSite.bind(documentationManager); 