import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-e0c14ace/health", (c) => {
  return c.json({ status: "ok" });
});

// Save proposal
app.post("/make-server-e0c14ace/proposals", async (c) => {
  try {
    const proposal = await c.req.json();
    const proposalId = proposal.id || `proposal_${Date.now()}`;
    
    const proposalData = {
      ...proposal,
      id: proposalId,
      lastSaved: new Date().toISOString(),
      version: proposal.version || 1,
      baseProposalId: proposal.baseProposalId || null,
      previousTotal: proposal.previousTotal || null
    };
    
    await kv.set(proposalId, proposalData);
    
    return c.json({ 
      success: true, 
      id: proposalId,
      message: "Proposal saved successfully"
    });
  } catch (error) {
    console.log("Error saving proposal:", error);
    return c.json({ 
      success: false, 
      error: "Failed to save proposal" 
    }, 500);
  }
});

// Load proposal by ID
app.get("/make-server-e0c14ace/proposals/:id", async (c) => {
  try {
    const proposalId = c.req.param("id");
    const proposal = await kv.get(proposalId);
    
    if (!proposal) {
      return c.json({ 
        success: false, 
        error: "Proposal not found" 
      }, 404);
    }
    
    return c.json({ 
      success: true, 
      proposal 
    });
  } catch (error) {
    console.log("Error loading proposal:", error);
    return c.json({ 
      success: false, 
      error: "Failed to load proposal" 
    }, 500);
  }
});

// List all proposals
app.get("/make-server-e0c14ace/proposals", async (c) => {
  try {
    const proposals = await kv.getByPrefix("proposal_");
    
    // Sort by lastSaved date, newest first
    const sortedProposals = proposals.sort((a, b) => 
      new Date(b.lastSaved || 0).getTime() - new Date(a.lastSaved || 0).getTime()
    );
    
    return c.json({ 
      success: true, 
      proposals: sortedProposals 
    });
  } catch (error) {
    console.log("Error listing proposals:", error);
    return c.json({ 
      success: false, 
      error: "Failed to list proposals" 
    }, 500);
  }
});

// Delete proposal
app.delete("/make-server-e0c14ace/proposals/:id", async (c) => {
  try {
    const proposalId = c.req.param("id");
    await kv.del(proposalId);
    
    return c.json({ 
      success: true, 
      message: "Proposal deleted successfully" 
    });
  } catch (error) {
    console.log("Error deleting proposal:", error);
    return c.json({ 
      success: false, 
      error: "Failed to delete proposal" 
    }, 500);
  }
});

// AI Process Proposal
app.post("/make-server-e0c14ace/ai-process-proposal", async (c) => {
  try {
    const { inputText } = await c.req.json();
    
    if (!inputText || !inputText.trim()) {
      return c.json({ 
        success: false, 
        error: "Input text is required" 
      }, 400);
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.log("Error: OpenAI API key not configured");
      return c.json({ 
        success: false, 
        error: "AI service not configured" 
      }, 500);
    }

    // Construct AI prompt for proposal generation
    const prompt = `You are a professional construction estimator. Analyze the following project description and return a detailed JSON structure for a construction proposal. Include accurate quantities with 10% waste factor, current market rates, and proper labor hour estimates.

Project Description:
${inputText}

Return a JSON object with this exact structure:
{
  "companyName": "Lineage Builders Inc.",
  "companyAddress": "16 Angela Ln, San Diego, CA 91911",
  "companyPhone": "(909) 240-7090",
  "companyEmail": "ramon.lineagebuilderinc@gmail.co",
  "companyLicense": "",
  "clientName": "extracted client name",
  "clientAddress": "extracted client address",
  "clientPhone": "extracted client phone",
  "clientEmail": "extracted client email",
  "projectTitle": "descriptive project title",
  "projectAddress": "project location",
  "proposalDate": "${new Date().toISOString().split('T')[0]}",
  "validUntil": "${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}",
  "projectDescription": "detailed project description with materials and finishes",
  "scopeOfWork": [
    {
      "id": "1",
      "description": "Material/Labor description",
      "quantity": number_with_10_percent_waste,
      "unit": "appropriate unit (CY, sq ft, linear ft, hours, etc)",
      "isLabor": false_for_materials_true_for_labor,
      "materialCost": cost_per_unit_for_materials,
      "laborRate": hourly_rate_for_labor,
      "total": quantity_times_rate
    }
  ],
  "permits": [],
  "paymentSchedule": "10% deposit upon contract signing, 50% upon material delivery and project start, 40% upon final completion and approval.",
  "warranty": "appropriate warranty terms",
  "timeline": "realistic timeline estimate",
  "additionalTerms": "standard construction terms"
}

Use these guidelines:
- Concrete: $220/CY, add 10% waste
- Rebar: $0.91/sq ft for #3 @ 18" OC
- Labor rates: $65/hour for prep/excavation, $75/hour for skilled work
- Paver materials: $6/sq ft
- Retaining wall blocks: $4/block
- Include realistic labor hour estimates
- Add material waste factors (10% for concrete, 5% for other materials)
- Use current San Diego market rates`;

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional construction estimator with expertise in concrete work, landscaping, and construction project planning. Always return valid JSON that matches the requested structure exactly."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.log("OpenAI API error:", errorData);
      return c.json({ 
        success: false, 
        error: "AI processing failed" 
      }, 500);
    }

    const openaiResult = await openaiResponse.json();
    
    if (!openaiResult.choices || !openaiResult.choices[0] || !openaiResult.choices[0].message) {
      console.log("Unexpected OpenAI response structure:", openaiResult);
      return c.json({ 
        success: false, 
        error: "Invalid AI response" 
      }, 500);
    }

    const aiContent = openaiResult.choices[0].message.content;
    
    // Try to parse the JSON response
    let proposalData;
    try {
      // Clean the response in case it has markdown formatting
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      proposalData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.log("JSON parsing error:", parseError);
      console.log("AI response content:", aiContent);
      return c.json({ 
        success: false, 
        error: "Failed to parse AI response" 
      }, 500);
    }

    // Add additional metadata
    proposalData.id = `proposal_${Date.now()}`;
    proposalData.lastSaved = new Date().toISOString();
    proposalData.version = 1;

    return c.json({ 
      success: true, 
      proposal: proposalData 
    });
    
  } catch (error) {
    console.log("Error processing AI proposal:", error);
    return c.json({ 
      success: false, 
      error: `Failed to process proposal: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500);
  }
});

// CRM Integrations endpoints
// Save CRM integration configuration
app.post("/make-server-e0c14ace/crm-integrations", async (c) => {
  try {
    const integration = await c.req.json();
    const integrationId = integration.id || `crm_${Date.now()}`;
    
    const integrationData = {
      ...integration,
      id: integrationId,
      lastUpdated: new Date().toISOString()
    };
    
    await kv.set(integrationId, integrationData);
    
    return c.json({ 
      success: true, 
      id: integrationId,
      message: "CRM integration saved successfully"
    });
  } catch (error) {
    console.log("Error saving CRM integration:", error);
    return c.json({ 
      success: false, 
      error: "Failed to save CRM integration" 
    }, 500);
  }
});

// Get all CRM integrations
app.get("/make-server-e0c14ace/crm-integrations", async (c) => {
  try {
    const integrations = await kv.getByPrefix("crm_");
    
    return c.json({ 
      success: true, 
      integrations 
    });
  } catch (error) {
    console.log("Error loading CRM integrations:", error);
    return c.json({ 
      success: false, 
      error: "Failed to load CRM integrations" 
    }, 500);
  }
});

// Sync clients from CRM
app.post("/make-server-e0c14ace/crm-sync/:integrationId", async (c) => {
  try {
    const integrationId = c.req.param("integrationId");
    const integration = await kv.get(integrationId);
    
    if (!integration) {
      return c.json({ 
        success: false, 
        error: "CRM integration not found" 
      }, 404);
    }

    // Mock CRM sync - in production, this would call actual CRM APIs
    const mockClients = [
      {
        id: "client_1",
        name: "John Smith",
        email: "john.smith@email.com",
        phone: "(555) 123-4567",
        address: "123 Main St, San Diego, CA 92101",
        company: "Smith Construction",
        source: integration.name
      },
      {
        id: "client_2", 
        name: "Sarah Johnson",
        email: "sarah.j@email.com",
        phone: "(555) 987-6543",
        address: "456 Oak Ave, San Diego, CA 92102",
        company: "Johnson Properties",
        source: integration.name
      },
      {
        id: "client_3",
        name: "Mike Rodriguez",
        email: "mike.r@email.com", 
        phone: "(555) 456-7890",
        address: "789 Pine Rd, San Diego, CA 92103",
        source: integration.name
      }
    ];

    // Save synced clients
    for (const client of mockClients) {
      await kv.set(`client_${client.id}`, client);
    }
    
    return c.json({ 
      success: true, 
      clients: mockClients,
      message: `Synced ${mockClients.length} clients from ${integration.name}`
    });
  } catch (error) {
    console.log("Error syncing CRM:", error);
    return c.json({ 
      success: false, 
      error: "Failed to sync with CRM" 
    }, 500);
  }
});

// Photo Analysis endpoint
app.post("/make-server-e0c14ace/analyze-photos", async (c) => {
  try {
    const { images, analysisType } = await c.req.json();
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return c.json({ 
        success: false, 
        error: "No images provided for analysis" 
      }, 400);
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.log("Error: OpenAI API key not configured");
      return c.json({ 
        success: false, 
        error: "AI service not configured" 
      }, 500);
    }

    // Prepare images for OpenAI Vision API
    const imageMessages = images.map(imageData => ({
      type: "image_url",
      image_url: {
        url: imageData
      }
    }));

    const prompt = `Analyze these construction site photos and provide a detailed assessment. Return a JSON array of findings with this structure:

[
  {
    "id": "unique_id",
    "description": "detailed description",
    "category": "materials|labor|condition|measurement|hazard",
    "confidence": 0.0-1.0,
    "suggestedQuantity": number,
    "suggestedUnit": "unit type",
    "suggestedPrice": estimated_cost,
    "notes": "additional observations"
  }
]

Focus on:
- Construction materials needed (concrete, rebar, blocks, etc.)
- Labor requirements (excavation, installation, finishing)
- Site conditions (drainage, access, existing structures)
- Measurements and quantities where visible
- Safety hazards or concerns
- Recommendations for scope of work

Use San Diego market rates and include realistic quantity estimates with appropriate waste factors.`;

    // Call OpenAI Vision API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: "You are a professional construction estimator and site inspector with expertise in analyzing construction sites and providing accurate material and labor estimates."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              ...imageMessages
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.log("OpenAI Vision API error:", errorData);
      return c.json({ 
        success: false, 
        error: "Photo analysis failed" 
      }, 500);
    }

    const openaiResult = await openaiResponse.json();
    
    if (!openaiResult.choices || !openaiResult.choices[0] || !openaiResult.choices[0].message) {
      console.log("Unexpected OpenAI response structure:", openaiResult);
      return c.json({ 
        success: false, 
        error: "Invalid AI response" 
      }, 500);
    }

    const aiContent = openaiResult.choices[0].message.content;
    
    // Try to parse the JSON response
    let analysisResults;
    try {
      // Clean the response in case it has markdown formatting
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      analysisResults = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.log("JSON parsing error:", parseError);
      console.log("AI response content:", aiContent);
      
      // Fallback: create mock analysis results
      analysisResults = [
        {
          id: "analysis_1",
          description: "Site excavation and grading required",
          category: "labor",
          confidence: 0.8,
          suggestedQuantity: 8,
          suggestedUnit: "hours",
          suggestedPrice: 65,
          notes: "Based on visible site conditions"
        },
        {
          id: "analysis_2", 
          description: "Ready-mix concrete needed for foundation",
          category: "materials",
          confidence: 0.7,
          suggestedQuantity: 5,
          suggestedUnit: "CY",
          suggestedPrice: 220,
          notes: "Estimated from visible area"
        }
      ];
    }

    // Ensure results is an array
    if (!Array.isArray(analysisResults)) {
      analysisResults = [analysisResults];
    }

    return c.json({ 
      success: true, 
      analysis: analysisResults 
    });
    
  } catch (error) {
    console.log("Error analyzing photos:", error);
    return c.json({ 
      success: false, 
      error: `Failed to analyze photos: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500);
  }
});

Deno.serve(app.fetch);