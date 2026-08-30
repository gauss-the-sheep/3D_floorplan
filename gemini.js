/**
 * gemini.js - Multimodal AI & Groq Integration for 3D Floor Plan Digital Twin
 */

const API_KEY_STORAGE_KEY = 'digital_twin_gemini_api_key';
const GEMINI_MODEL = 'gemini-2.0-flash';

/**
 * Tool definitions for Gemini Function Calling
 */
export const geminiTools = [
    {
        functionDeclarations: [
            {
                name: 'setLayerVisibility',
                description: 'Toggle visibility of 3D building layers such as water pipes, electrical lines, emergency pathways, window shell, or multi-floor mode.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        pipes: { type: 'BOOLEAN', description: 'Show or hide water pipes layer' },
                        electrical: { type: 'BOOLEAN', description: 'Show or hide electrical wiring layer' },
                        escape: { type: 'BOOLEAN', description: 'Show or hide emergency escape routes layer' },
                        windows: { type: 'BOOLEAN', description: 'Show or hide window shell layer' },
                        multiFloor: { type: 'BOOLEAN', description: 'Enable or disable multi-floor view mode' }
                    }
                }
            },
            {
                name: 'highlightFireZone',
                description: 'Highlight a specific room, floor, and block with a fire/emergency hazard alert overlay and effect.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        blockIdx: { type: 'INTEGER', description: 'Block index (0 to 3)' },
                        roomIdx: { type: 'INTEGER', description: 'Room index (0 to 5)' },
                        floorIdx: { type: 'INTEGER', description: 'Floor index (0 to 5)' }
                    },
                    required: ['blockIdx', 'roomIdx', 'floorIdx']
                }
            },
            {
                name: 'toggleWalkthrough',
                description: 'Enter or exit first-person walkthrough mode inside the 3D building.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        enable: { type: 'BOOLEAN', description: 'True to enter walkthrough mode, false to exit' }
                    },
                    required: ['enable']
                }
            },
            {
                name: 'setCameraPreset',
                description: 'Position the 3D camera to a predefined perspective or focus on a specific floor.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        preset: {
                            type: 'STRING',
                            enum: ['isometric', 'top', 'front', 'side'],
                            description: 'Camera view angle preset'
                        },
                        floorIndex: { type: 'INTEGER', description: 'Optional floor index to focus camera target on' }
                    },
                    required: ['preset']
                }
            },
            {
                name: 'setFloorsCount',
                description: 'Set the number of building floors (override auto detection).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        count: { type: 'INTEGER', description: 'Number of floors (1 to 20)' }
                    },
                    required: ['count']
                }
            },
            {
                name: 'clearBuildingScene',
                description: 'Clear the current 3D building model and reset the scene.',
                parameters: {
                    type: 'OBJECT',
                    properties: {}
                }
            },
            {
                name: 'renderBuildingLayout',
                description: 'Construct and render a 3D building layout by specifying floors and an array of rooms/areas with coordinates and dimensions.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        floors: { type: 'INTEGER', description: 'Number of building floors (usually 1 for simple floor plans)' },
                        rooms: {
                            type: 'ARRAY',
                            description: 'List of rooms/areas to render in the building layout',
                            items: {
                                type: 'OBJECT',
                                properties: {
                                    name: { type: 'STRING', description: 'Name of the room (e.g. Master Bedroom, Kitchen, Living Room)' },
                                    type: { type: 'STRING', description: 'Type of room: "room", "bedroom", "kitchen", "toilet", "corridor", "office", "shop"' },
                                    x: { type: 'NUMBER', description: 'Center X coordinate in meters relative to building center (between -25 and 25)' },
                                    z: { type: 'NUMBER', description: 'Center Z coordinate in meters relative to building center (between -35 and 35)' },
                                    width: { type: 'NUMBER', description: 'Width of the room in meters (e.g. 4.0)' },
                                    depth: { type: 'NUMBER', description: 'Depth/length of the room in meters (e.g. 5.0)' }
                                },
                                required: ['name', 'type', 'x', 'z', 'width', 'depth']
                            }
                        }
                    },
                    required: ['rooms']
                }
            }
        ]
    }
];

/**
 * Tool definitions for Groq / OpenAI Function Calling format
 */
export const groqTools = [
    {
        type: 'function',
        function: {
            name: 'setLayerVisibility',
            description: 'Toggle visibility of 3D building layers such as water pipes, electrical lines, emergency pathways, window shell, or multi-floor mode.',
            parameters: {
                type: 'object',
                properties: {
                    pipes: { type: 'boolean', description: 'Show or hide water pipes layer' },
                    electrical: { type: 'boolean', description: 'Show or hide electrical wiring layer' },
                    escape: { type: 'boolean', description: 'Show or hide emergency escape routes layer' },
                    windows: { type: 'boolean', description: 'Show or hide window shell layer' },
                    multiFloor: { type: 'boolean', description: 'Enable or disable multi-floor view mode' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'highlightFireZone',
            description: 'Highlight a specific room, floor, and block with a fire/emergency hazard alert overlay and effect.',
            parameters: {
                type: 'object',
                properties: {
                    blockIdx: { type: 'integer', description: 'Block index (0 to 3)' },
                    roomIdx: { type: 'integer', description: 'Room index (0 to 5)' },
                    floorIdx: { type: 'integer', description: 'Floor index (0 to 5)' }
                },
                required: ['blockIdx', 'roomIdx', 'floorIdx']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'toggleWalkthrough',
            description: 'Enter or exit first-person walkthrough mode inside the 3D building.',
            parameters: {
                type: 'object',
                properties: {
                    enable: { type: 'boolean', description: 'True to enter walkthrough mode, false to exit' }
                },
                required: ['enable']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'setCameraPreset',
            description: 'Position the 3D camera to a predefined perspective or focus on a specific floor.',
            parameters: {
                type: 'object',
                properties: {
                    preset: {
                        type: 'string',
                        enum: ['isometric', 'top', 'front', 'side'],
                        description: 'Camera view angle preset'
                    },
                    floorIndex: { type: 'integer', description: 'Optional floor index to focus camera target on' }
                },
                required: ['preset']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'setFloorsCount',
            description: 'Set the number of building floors (override auto detection).',
            parameters: {
                type: 'object',
                properties: {
                    count: { type: 'integer', description: 'Number of floors (1 to 20)' }
                },
                required: ['count']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'clearBuildingScene',
            description: 'Clear the current 3D building model and reset the scene.',
            parameters: {
                type: 'object',
                properties: {}
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'renderBuildingLayout',
            description: 'Construct and render a 3D building layout by specifying floors and an array of rooms/areas with coordinates and dimensions.',
            parameters: {
                type: 'object',
                properties: {
                    floors: { type: 'integer', description: 'Number of building floors (usually 1 for simple floor plans)' },
                    rooms: {
                        type: 'array',
                        description: 'List of rooms/areas to render in the building layout',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', description: 'Name of the room (e.g. Master Bedroom, Kitchen, Living Room)' },
                                type: { type: 'string', description: 'Type of room: "room", "bedroom", "kitchen", "toilet", "corridor", "office", "shop"' },
                                x: { type: 'number', description: 'Center X coordinate in meters relative to building center (between -25 and 25)' },
                                z: { type: 'number', description: 'Center Z coordinate in meters relative to building center (between -35 and 35)' },
                                width: { type: 'number', description: 'Width of the room in meters (e.g. 4.0)' },
                                depth: { type: 'number', description: 'Depth/length of the room in meters (e.g. 5.0)' }
                            },
                            required: ['name', 'type', 'x', 'z', 'width', 'depth']
                        }
                    }
                },
                required: ['rooms']
            }
        }
    }
];

const DEFAULT_API_KEY = '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';

export function getApiKey() {
    const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (saved && (saved.startsWith('gsk_') || saved.startsWith('AIza'))) {
        return saved;
    }
    return DEFAULT_API_KEY;
}

export function setApiKey(key) {
    const trimmed = (key || '').trim();
    if (trimmed) {
        localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
    } else {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
    return trimmed;
}

const SYSTEM_INSTRUCTION = `
You are the AI Assistant for the 3D Floor Plan Digital Twin application.
Your role is to assist users in analyzing floor plans, managing building systems (water pipes, electrical wiring, emergency pathways, windows), inspecting hazard zones, and navigating the 3D scene.

Capabilities:
1. You can answer questions about floor plan analysis, building safety, facility management, and room measurements.
2. You can execute 3D scene actions via Function Calling tools:
   - setLayerVisibility: toggle visibility of pipes, electrical, escape routes, windows, or multi-floor.
   - highlightFireZone: highlight a fire/hazard in a specific room (blockIdx, roomIdx, floorIdx).
   - toggleWalkthrough: enter/exit 3D first-person walkthrough.
   - setCameraPreset: change camera view angle (isometric, top, front, side).
   - setFloorsCount: override number of floors (1-20).
   - clearBuildingScene: clear the 3D building.
   - renderBuildingLayout: reconstruct and render a 3D building layout (rooms with custom dimensions/names/coordinates). Use this when the user attaches a 2D floor plan image and asks you to parse/analyze/render/construct it in 3D. Inspect the visual layout, name each room, locate its center (X, Z) and size (width, depth) relative to the center of the building, and render it.

When a user asks to perform an action on the 3D model (e.g., "show me water pipes", "highlight room 1 floor 0", "start walkthrough", "analyze the image and construct it in 3D"), call the appropriate function tool. Always be concise, helpful, and professional.
`;

/**
 * Send prompt to AI API (automatically handles both Groq and Gemini)
 */
export async function queryGemini({ prompt, imageBase64, buildingContext, history = [], onActionExecute }) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API Key is missing. Click the key icon in the AI Chat panel to set your API Key.");
    }

    // Auto-detect Groq API Key (starts with gsk_)
    if (apiKey.startsWith('gsk_')) {
        return await queryGroq({ prompt, buildingContext, history, onActionExecute, apiKey });
    }

    // Gemini API Request
    const contents = [];

    history.forEach(item => {
        contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
        });
    });

    const currentParts = [];
    if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        currentParts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
            }
        });
    }

    let fullPromptText = prompt;
    if (buildingContext) {
        fullPromptText += `\n\n[Current Building Context: ${JSON.stringify(buildingContext)}]`;
    }
    currentParts.push({ text: fullPromptText });

    contents.push({
        role: 'user',
        parts: currentParts
    });

    const requestBody = {
        systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents: contents,
        tools: geminiTools
    };

    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError = null;
    let response = null;

    for (const modelName of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (res.ok) {
                response = res;
                break;
            } else {
                const errorData = await res.json().catch(() => ({}));
                const msg = errorData.error?.message || `HTTP error ${res.status}: ${res.statusText}`;
                lastError = new Error(msg);
                if (res.status === 429 || msg.includes('quota') || msg.includes('Quota')) {
                    console.warn(`Model ${modelName} hit quota limit, trying fallback...`);
                    continue;
                } else {
                    throw lastError;
                }
            }
        } catch (e) {
            lastError = e;
        }
    }

    if (!response) {
        throw lastError || new Error("Failed to query AI models.");
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (!candidate) {
        throw new Error("No response generated by AI.");
    }

    const modelParts = candidate.content?.parts || [];
    let textResponse = '';
    const actionsExecuted = [];

    for (const part of modelParts) {
        if (part.text) {
            textResponse += part.text + ' ';
        }
        if (part.functionCall) {
            const { name, args } = part.functionCall;
            if (typeof onActionExecute === 'function') {
                const resultText = onActionExecute(name, args);
                actionsExecuted.push({ name, args, resultText });
            }
        }
    }

    return {
        text: textResponse.trim() || (actionsExecuted.length > 0 ? `Executed action: ${actionsExecuted.map(a => a.name).join(', ')}` : 'Completed.'),
        actionsExecuted
    };
}

/**
 * Query Groq API (High Speed Llama 3.3 70B Engine)
 */
async function queryGroq({ prompt, buildingContext, history = [], onActionExecute, apiKey }) {
    const messages = [
        { role: 'system', content: SYSTEM_INSTRUCTION }
    ];

    history.forEach(item => {
        messages.push({
            role: item.role === 'user' ? 'user' : 'assistant',
            content: item.text
        });
    });

    let userPrompt = prompt;
    if (buildingContext) {
        userPrompt += `\n\n[Current Building Context: ${JSON.stringify(buildingContext)}]`;
    }
    messages.push({ role: 'user', content: userPrompt });

    const requestBody = {
        model: 'qwen/qwen3.8-27b',
        messages: messages,
        tools: groqTools,
        tool_choice: 'auto'
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || `Groq API Error ${response.status}: ${response.statusText}`;
        throw new Error(msg);
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message;
    if (!choice) {
        throw new Error("No response returned from Groq API.");
    }

    let textResponse = choice.content || '';
    const actionsExecuted = [];

    if (choice.tool_calls && choice.tool_calls.length > 0) {
        for (const toolCall of choice.tool_calls) {
            const fnName = toolCall.function.name;
            let fnArgs = {};
            try {
                fnArgs = JSON.parse(toolCall.function.arguments || '{}');
            } catch (e) {}

            if (typeof onActionExecute === 'function') {
                const resultText = onActionExecute(fnName, fnArgs);
                actionsExecuted.push({ name: fnName, args: fnArgs, resultText });
            }
        }
    }

    return {
        text: textResponse.trim() || (actionsExecuted.length > 0 ? `Executed action: ${actionsExecuted.map(a => a.name).join(', ')}` : 'Completed.'),
        actionsExecuted
    };
}

/**
 * Sends a base64-encoded floor plan image to Gemini 2.0 Flash to detect the 3D layout.
 */
async function analyzeFloorPlanWithGemini(imageBase64, imgWidth, imgHeight) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Gemini API Key is missing.");
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const aspectRatioStr = (imgWidth && imgHeight) ? `Image dimensions: ${imgWidth}x${imgHeight} pixels (aspect ratio: ${(imgWidth / imgHeight).toFixed(3)}). Scale the X axis (horizontal) and Z axis (vertical) coordinates and room dimensions proportionally to preserve this aspect ratio exactly. Center the layout at (0, 0) and scale it so that the maximum building dimension (width or depth) is 80 meters, and the other is scaled proportionally.` : 'Scale coordinates so that the entire floor layout fits within a -25 to +25 range for X, and -35 to +35 range for Z.';

    const systemPrompt = `You are a professional architectural AI system. Your task is to analyze the 2D floor plan image and generate a clean, accurate 3D layout representation in JSON format.
Identify all rooms, shops, corridors, halls, and restrooms shown in the 2D diagram.
For each room/area:
1. Estimate its real-world dimensions in meters (width and depth).
2. Calculate its center coordinates (X and Z) relative to the center of the building (0, 0) on the ground floor plane. X axis represents horizontal layout, Z axis represents vertical layout.
3. Use ratio logic to scale the coordinates and dimensions relative to the image itself so it doesn't look stretched or disproportionate. ${aspectRatioStr}
4. Assign a descriptive name (e.g., "Living Room", "Bedroom 1", "Kitchen", "Restroom") and a type (one of: "room", "bedroom", "kitchen", "toilet", "corridor", "office", "shop").

Return ONLY a valid JSON object matching the following structure. Do NOT wrap the JSON in markdown code blocks (\`\`\`json ... \`\`\`), do not output any other text:
{
  "floors": 1,
  "rooms": [
    {
      "name": "Living Room",
      "type": "room",
      "x": -5.5,
      "z": 10.2,
      "width": 8.0,
      "depth": 6.5
    }
  ],
  "walls": [],
  "doors": [],
  "windows": [],
  "stairs": [],
  "elevators": [],
  "fireAssets": {
    "extinguishers": [],
    "hoseReels": [],
    "hydrants": [],
    "detectors": [],
    "alarms": [],
    "emergencyLights": [],
    "exits": []
  },
  "source": "gemini_vision"
}`;

    const requestBody = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: cleanBase64
                        }
                    },
                    {
                        text: "Extract the 3D building layout from this floor plan image. Output ONLY valid JSON matching the specified schema."
                    }
                ]
            }
        ],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            responseMimeType: "application/json"
        }
    };

    const modelName = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.error?.message || `HTTP error ${res.status}: ${res.statusText}`;
        throw new Error(msg);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate) {
        throw new Error("No response generated by AI.");
    }

    const textResponse = candidate.content?.parts?.[0]?.text;
    if (!textResponse) {
        throw new Error("Empty response generated by AI.");
    }

    try {
        let cleanJsonText = textResponse.trim();
        if (cleanJsonText.startsWith("```")) {
            cleanJsonText = cleanJsonText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }
        const buildingData = JSON.parse(cleanJsonText);
        if (!buildingData.rooms || !Array.isArray(buildingData.rooms)) {
            throw new Error("Invalid building data format: 'rooms' array is missing.");
        }
        buildingData.source = "gemini_vision";
        return buildingData;
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini Vision:", textResponse);
        throw new Error("Failed to parse AI response as valid building data: " + e.message);
    }
}

/**
 * Sends a base64-encoded floor plan image to Groq Llama 3.2 Vision to detect the 3D layout.
 */
async function analyzeFloorPlanWithGroq(imageBase64, apiKey, imgWidth, imgHeight) {
    const aspectRatioStr = (imgWidth && imgHeight) ? `Image dimensions: ${imgWidth}x${imgHeight} pixels (aspect ratio: ${(imgWidth / imgHeight).toFixed(3)}). Scale the X axis (horizontal) and Z axis (vertical) coordinates and room dimensions proportionally to preserve this aspect ratio exactly. Center the layout at (0, 0) and scale it so that the maximum building dimension (width or depth) is 80 meters, and the other is scaled proportionally.` : 'Scale coordinates so that the entire floor layout fits within a -25 to +25 range for X, and -35 to +35 range for Z.';

    const messages = [
        {
            role: 'system',
            content: `You are a professional architectural AI system. Your task is to analyze the 2D floor plan image and generate a clean, accurate 3D layout representation in JSON format.
Identify all rooms, shops, corridors, halls, and restrooms shown in the 2D diagram.
For each room/area:
1. Estimate its real-world dimensions in meters (width and depth).
2. Calculate its center coordinates (X and Z) relative to the center of the building (0, 0) on the ground floor plane. X axis represents horizontal layout, Z axis represents vertical layout.
3. Use ratio logic to scale the coordinates and dimensions relative to the image itself so it doesn't look stretched or disproportionate. ${aspectRatioStr}
4. Assign a descriptive name (e.g., "Living Room", "Bedroom 1", "Kitchen", "Restroom") and a type (one of: "room", "bedroom", "kitchen", "toilet", "corridor", "office", "shop").

Return ONLY a valid JSON object matching the following structure. Do NOT wrap the JSON in markdown code blocks (\`\`\`json ... \`\`\`), do not output any other text:
{
  "floors": 1,
  "rooms": [
    {
      "name": "Living Room",
      "type": "room",
      "x": -5.5,
      "z": 10.2,
      "width": 8.0,
      "depth": 6.5
    }
  ],
  "walls": [],
  "doors": [],
  "windows": [],
  "stairs": [],
  "elevators": [],
  "fireAssets": {
    "extinguishers": [],
    "hoseReels": [],
    "hydrants": [],
    "detectors": [],
    "alarms": [],
    "emergencyLights": [],
    "exits": []
  },
  "source": "groq_vision"
}`
        },
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: 'Extract the 3D building layout from this floor plan image. Output ONLY valid JSON.'
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: imageBase64
                    }
                }
            ]
        }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'qwen/qwen3.8-27b',
            messages: messages,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || `Groq API Error ${response.status}: ${response.statusText}`;
        throw new Error(msg);
    }

    const data = await response.json();
    const textResponse = data.choices?.[0]?.message?.content;
    if (!textResponse) {
        throw new Error("Empty response returned from Groq API.");
    }

    try {
        let cleanJsonText = textResponse.trim();
        if (cleanJsonText.startsWith("```")) {
            cleanJsonText = cleanJsonText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }
        const buildingData = JSON.parse(cleanJsonText);
        if (!buildingData.rooms || !Array.isArray(buildingData.rooms)) {
            throw new Error("Invalid building data format: 'rooms' array is missing.");
        }
        buildingData.source = "groq_vision";
        return buildingData;
    } catch (e) {
        console.error("Failed to parse JSON response from Groq Vision:", textResponse);
        throw new Error("Failed to parse Groq AI response as valid building data: " + e.message);
    }
}

/**
 * Automatically routes the base64 image parsing request depending on API Key type.
 */
export async function analyzeFloorPlanWithAI(imageBase64, imgWidth, imgHeight) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API Key is missing. Click the key icon in the AI Chat panel to set your API Key.");
    }

    if (apiKey.startsWith('gsk_')) {
        return await analyzeFloorPlanWithGroq(imageBase64, apiKey, imgWidth, imgHeight);
    } else {
        return await analyzeFloorPlanWithGemini(imageBase64, imgWidth, imgHeight);
    }
}
