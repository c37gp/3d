# 🤖 **Intégration IA avec Fusion360-Web**

Ce guide explique comment connecter un **agent IA** à Fusion360-Web pour permettre la **génération procédurale d'objets 3D**, les **suggestions d'opérations booléennes**, l'**optimisation de scènes**, et plus encore.

---

## 🎯 **Concepts de Base**

Fusion360-Web peut se connecter à n'importe quel **agent IA** qui implémente l'API suivante :

### **Requête IA**
```json
{
  "prompt": "Crée un cube rouge de 2m de côté",
  "context": "Génération d'un objet 3D pour une scène",
  "parameters": {
    "type": "object",
    "scene": "{...}"
  }
}
```

### **Réponse IA**
```json
{
  "success": true,
  "message": "Objet généré avec succès",
  "geometry": {
    "type": "box",
    "width": 2,
    "height": 2,
    "depth": 2,
    "name": "Cube Rouge"
  },
  "operations": []
}
```

---

## 🚀 **Méthodes d'Intégration**

### **1. API REST (Recommandé)**

Créez un serveur HTTP qui répond aux requêtes POST sur `/api/ai`.

#### **Exemple avec FastAPI (Python)**

```python
from fastapi import FastAPI, Request
from pydantic import BaseModel

app = FastAPI()

class AIRequest(BaseModel):
    prompt: str
    context: str = None
    parameters: dict = None

class AIResponse(BaseModel):
    success: bool
    message: str = None
    data: dict = None
    geometry: dict = None
    operations: list = None

@app.post("/api/ai")
async def handle_ai_request(request: AIRequest):
    # Traiter la requête
    if "cube" in request.prompt.lower():
        return AIResponse(
            success=True,
            message="Cube généré",
            geometry={
                "type": "box",
                "width": 1,
                "height": 1,
                "depth": 1,
                "name": "Cube"
            }
        )
    
    return AIResponse(
        success=False,
        message="Je ne comprends pas la requête"
    )

# Lancer avec: uvicorn main:app --reload
```

#### **Configuration dans Fusion360-Web**

1. Cliquez sur le bouton **"IA"** dans la barre d'outils
2. Cliquez sur **"Configurer API IA"**
3. Entrez l'URL de votre API (ex: `http://localhost:8000/api/ai`)
4. Entrez votre clé API (si nécessaire)
5. Cliquez sur **OK**

---

### **2. WebSocket (Temps Réel)**

Pour une communication **bidirectionnelle et temps réel**, utilisez WebSocket.

#### **Exemple avec FastAPI (Python)**

```python
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse

app = FastAPI()

@app.websocket("/ws/ai")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    while True:
        data = await websocket.receive_json()
        
        # Traiter la requête
        if data["type"] == "ai_request":
            response = {
                "type": "ai_response",
                "success": True,
                "message": "Réponse de l'IA",
                "geometry": {
                    "type": "box",
                    "width": 1,
                    "height": 1,
                    "depth": 1
                }
            }
            await websocket.send_json(response)

# Lancer avec: uvicorn main:app --reload
```

#### **Connexion dans Fusion360-Web**

```typescript
const ws = aiIntegration.connectWebSocket('ws://localhost:8000/ws/ai');

if (ws) {
  // Envoyer une requête
  aiIntegration.sendWebSocketRequest(ws, {
    prompt: "Crée un cube",
    context: "Génération 3D"
  });
  
  // Fermer la connexion
  // aiIntegration.closeWebSocket(ws);
}
```

---

### **3. Fonctions Locales (JavaScript)**

Si vous préférez **ne pas utiliser de serveur**, vous pouvez implémenter directement les fonctions IA dans Fusion360-Web.

#### **Exemple**

```typescript
// Dans votre code
import { aiIntegration } from './lib/utils/AIIntegration';

// Configurer un gestionnaire de requêtes local
aiIntegration.onRequest((request) => {
  console.log('Requête IA:', request);
  
  // Traiter la requête
  if (request.prompt.includes('cube')) {
    const response: AIResponse = {
      success: true,
      message: 'Cube généré localement',
      geometry: {
        type: 'box',
        width: 1,
        height: 1,
        depth: 1
      }
    };
    
    // Envoyer la réponse
    aiIntegration.onResponse.forEach(cb => cb(response));
  }
});
```

---

## 🎨 **Cas d'Utilisation**

### **1. Génération d'Objets**

**Requête** :
```json
{
  "prompt": "Crée une table avec 4 pieds",
  "context": "Modélisation d'un meuble",
  "parameters": {
    "type": "object"
  }
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Table générée",
  "geometry": [
    {
      "type": "box",
      "width": 2,
      "height": 0.1,
      "depth": 1,
      "name": "Plateau"
    },
    {
      "type": "cylinder",
      "diameter": 0.1,
      "height": 0.8,
      "name": "Pied 1"
    }
    // ... 3 autres pieds
  ]
}
```

### **2. Suggestions d'Opérations Booléennes**

**Requête** :
```json
{
  "prompt": "Quelle opération entre ces objets?",
  "context": "Combinaison de formes",
  "parameters": {
    "type": "boolean_suggestion",
    "objects": [
      { "id": "obj1", "name": "Cube", "type": "box" },
      { "id": "obj2", "name": "Cylindre", "type": "cylinder" }
    ]
  }
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Opération suggérée",
  "data": {
    "operation": "subtraction",
    "objAId": "obj1",
    "objBId": "obj2"
  }
}
```

### **3. Optimisation de Scène**

**Requête** :
```json
{
  "prompt": "Optimise cette scène pour la performance",
  "context": "Scène complexe avec beaucoup d'objets",
  "parameters": {
    "type": "optimization",
    "criteria": "performance",
    "scene": { ... }
  }
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Scène optimisée",
  "data": {
    "optimizedScene": { ... },
    "reducedPolygons": 50,
    "mergedObjects": 10
  }
}
```

### **4. Génération d'Animations**

**Requête** :
```json
{
  "prompt": "Anime cette voiture qui roule",
  "context": "Animation d'un véhicule",
  "parameters": {
    "type": "animation",
    "objects": ["car"],
    "duration": 5
  }
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Animation générée",
  "data": {
    "animation": {
      "id": "anim-1",
      "name": "Voiture qui roule",
      "tracks": [
        {
          "target": "car",
          "property": "position",
          "keyframes": [
            { "time": 0, "value": { "x": 0, "y": 0, "z": 0 } },
            { "time": 5, "value": { "x": 10, "y": 0, "z": 0 } }
          ]
        }
      ]
    }
  }
}
```

### **5. Analyse de Projet**

**Requête** :
```json
{
  "prompt": "Analyse ce projet et suggère des améliorations",
  "context": "Audit de projet 3D",
  "parameters": {
    "type": "analysis",
    "project": { ... }
  }
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Analyse terminée",
  "data": {
    "suggestions": [
      {
        "type": "info",
        "description": "Votre projet contient 15 objets bien organisés",
        "action": null
      },
      {
        "type": "optimization",
        "description": "Vous pourriez fusionner 5 objets similaires",
        "action": {
          "type": "merge_objects",
          "objectIds": ["obj1", "obj2", "obj3", "obj4", "obj5"]
        }
      },
      {
        "type": "suggestion",
        "description": "Essayez d'ajouter une lumière directionnelle pour améliorer le rendu",
        "action": {
          "type": "add_light",
          "light": {
            "type": "directional",
            "direction": { "x": -1, "y": -1, "z": -1 },
            "intensity": 0.8
          }
        }
      }
    ]
  }
}
```

---

## 🛠 **Implémentation d'un Agent IA**

### **Structure de Base**

```python
from typing import Dict, Any, Optional
import json

class Fusion360AIAgent:
    def __init__(self):
        self.name = "Mon Agent IA"
        self.version = "1.0.0"
        self.capabilities = [
            "generate_objects",
            "suggest_boolean_operations",
            "optimize_scenes",
            "generate_animations",
            "analyze_projects"
        ]
    
    def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Traite une requête IA"""
        try:
            req_type = request.get("parameters", {}).get("type")
            
            if req_type == "object":
                return self.generate_object(request)
            elif req_type == "boolean_suggestion":
                return self.suggest_boolean(request)
            elif req_type == "optimization":
                return self.optimize_scene(request)
            elif req_type == "animation":
                return self.generate_animation(request)
            elif req_type == "analysis":
                return self.analyze_project(request)
            else:
                return self.handle_generic(request)
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Erreur: {str(e)}"
            }
    
    def generate_object(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Génère un objet 3D"""
        # Implémentez votre logique ici
        pass
    
    def suggest_boolean(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Suggère une opération booléenne"""
        # Implémentez votre logique ici
        pass
    
    def optimize_scene(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Optimise une scène"""
        # Implémentez votre logique ici
        pass
    
    def generate_animation(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Génère une animation"""
        # Implémentez votre logique ici
        pass
    
    def analyze_project(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Analyse un projet"""
        # Implémentez votre logique ici
        pass
    
    def handle_generic(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Traite une requête générique"""
        # Implémentez votre logique ici
        pass
```

---

## 🧠 **Utilisation de Modèles d'IA Externes**

### **1. Avec OpenAI (GPT-4 Vision)**

```python
import openai
from typing import Dict, Any

class OpenAIAgent:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
    
    def generate_object(self, prompt: str) -> Dict[str, Any]:
        response = self.client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": f"Crée un objet 3D basé sur cette description: {prompt}. "
                               "Retourne un objet JSON avec les propriétés géométriques "
                               "(type, dimensions, etc.). Ne retourne que le JSON, sans explication."
                }
            ]
        )
        
        try:
            # Extraire le JSON de la réponse
            content = response.choices[0].message.content
            # Nettoyer la réponse pour extraire le JSON
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            json_str = content[json_start:json_end]
            
            return {
                "success": True,
                "message": "Objet généré par GPT-4",
                "geometry": json.loads(json_str)
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Erreur: {str(e)}"
            }
```

### **2. Avec Claude (Anthropic)**

```python
import anthropic
from typing import Dict, Any

class ClaudeAgent:
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
    
    def generate_object(self, prompt: str) -> Dict[str, Any]:
        message = self.client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1000,
            messages=[
                {
                    "role": "user",
                    "content": f"Crée un objet 3D basé sur cette description: {prompt}. "
                               "Retourne un objet JSON avec les propriétés géométriques "
                               "(type, dimensions, etc.)."
                }
            ]
        )
        
        try:
            content = message.content[0].text
            # Extraire le JSON
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            json_str = content[json_start:json_end]
            
            return {
                "success": True,
                "message": "Objet généré par Claude",
                "geometry": json.loads(json_str)
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Erreur: {str(e)}"
            }
```

### **3. Avec un Modèle Local (Ollama)**

```python
import requests
from typing import Dict, Any

class OllamaAgent:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
    
    def generate_object(self, prompt: str) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/api/chat",
            json={
                "model": "llama3",
                "messages": [
                    {
                        "role": "user",
                        "content": f"Crée un objet 3D basé sur cette description: {prompt}. "
                                   "Retourne un objet JSON avec les propriétés géométriques "
                                   "(type, dimensions, etc.). Ne retourne que le JSON."
                    }
                ]
            }
        )
        
        try:
            content = response.json()["message"]["content"]
            # Extraire le JSON
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            json_str = content[json_start:json_end]
            
            return {
                "success": True,
                "message": "Objet généré par Llama",
                "geometry": json.loads(json_str)
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Erreur: {str(e)}"
            }
```

---

## 🎯 **Bonnes Pratiques**

### **1. Validation des Réponses**

Toujours valider les réponses de l'IA avant de les utiliser :

```typescript
// Dans Fusion360-Web
if (response.success && response.geometry) {
  // Valider la géométrie
  if (isValidGeometry(response.geometry)) {
    createObjectFromGeometry(response.geometry);
  } else {
    showError('Géométrie invalide');
  }
}
```

### **2. Gestion des Erreurs**

Implémentez une bonne gestion des erreurs :

```python
# Dans votre agent IA
def handle_request(self, request):
    try:
        # Traiter la requête
        return self.process_request(request)
    except Exception as e:
        return {
            "success": False,
            "message": f"Erreur interne: {str(e)}",
            "error": str(e)
        }
```

### **3. Logging**

Ajoutez du logging pour le débogage :

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handle_request(self, request):
    logger.info(f"Requête reçue: {request.get('prompt', '')[:50]}")
    try:
        response = self.process_request(request)
        logger.info(f"Requête traitée avec succès")
        return response
    except Exception as e:
        logger.error(f"Erreur lors du traitement: {str(e)}")
        return {"success": False, "message": str(e)}
```

### **4. Cache**

Cachez les réponses fréquentes pour améliorer les performances :

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def generate_object_cached(self, prompt: str) -> Dict[str, Any]:
    return self.generate_object({"prompt": prompt})
```

### **5. Rate Limiting**

Limitez le nombre de requêtes pour éviter les abus :

```python
from fastapi import FastAPI, Request
from fastapi.middleware import Middleware
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(middleware=[Middleware(limiter)])

@app.post("/api/ai")
@limiter.limit("10/minute")
async def handle_ai_request(request: Request):
    # Traiter la requête
    pass
```

---

## 📊 **Exemples Complets**

### **1. Agent IA Minimal avec FastAPI**

```python
# main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uvicorn

app = FastAPI()

# Configurer CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AIRequest(BaseModel):
    prompt: str
    context: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class AIResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    geometry: Optional[Dict[str, Any]] = None
    operations: Optional[list] = None

@app.post("/api/ai")
async def handle_ai_request(request: AIRequest):
    prompt = request.prompt.lower()
    
    # Génération d'objets
    if "cube" in prompt or "boîte" in prompt:
        return AIResponse(
            success=True,
            message="Cube généré",
            geometry={
                "type": "box",
                "width": 1,
                "height": 1,
                "depth": 1,
                "name": "Cube"
            }
        )
    
    elif "sphère" in prompt or "boule" in prompt:
        return AIResponse(
            success=True,
            message="Sphère générée",
            geometry={
                "type": "sphere",
                "diameter": 1,
                "segments": 32,
                "name": "Sphère"
            }
        )
    
    # Suggestions booléennes
    elif "union" in prompt or "fusion" in prompt:
        return AIResponse(
            success=True,
            message="Opération suggérée: Union",
            data={
                "operation": "union",
                "objAId": "obj1",
                "objBId": "obj2"
            }
        )
    
    # Réponse par défaut
    return AIResponse(
        success=True,
        message=f"J'ai compris: {request.prompt}",
        data={"understood": True}
    )

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### **2. Client Fusion360-Web avec Connexion IA**

```typescript
// Dans votre code React
import { useState } from 'react';
import { aiIntegration } from './lib/utils/AIIntegration';

function AIPanel() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResponse(null);

    try {
      // Configurer l'API
      aiIntegration.setApiUrl('http://localhost:8000/api/ai');
      
      // Envoyer la requête
      const result = await aiIntegration.sendRequest({
        prompt,
        context: 'Génération d\'objets 3D',
        parameters: { type: 'object' }
      });

      if (result && result.success && result.geometry) {
        setResponse(result);
        // Créer l'objet dans la scène
        createObjectFromAI(result.geometry);
      } else {
        setResponse(result);
      }
    } catch (error) {
      setResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Décrivez un objet 3D..."
      />
      <button onClick={handleGenerate} disabled={loading || !prompt}>
        {loading ? 'Génération...' : 'Générer'}
      </button>
      {response && (
        <div>
          {response.success ? (
            <p>✅ {response.message}</p>
          ) : (
            <p>❌ {response.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🔗 **Ressources Utiles**

### **Modèles d'IA**
- [OpenAI](https://openai.com/) - GPT-4, GPT-3.5
- [Anthropic](https://www.anthropic.com/) - Claude 3
- [Google](https://ai.google/) - Gemini
- [Meta](https://ai.meta.com/) - Llama 3
- [Mistral AI](https://mistral.ai/) - Mistral, Mixtral
- [Ollama](https://ollama.ai/) - Modèles locaux

### **Frameworks**
- [FastAPI](https://fastapi.tiangolo.com/) - API Python
- [Flask](https://flask.palletsprojects.com/) - API Python
- [Express.js](https://expressjs.com/) - API Node.js
- [NestJS](https://nestjs.com/) - API TypeScript

### **Bibliothèques**
- [requests](https://docs.python-requests.org/) - Requêtes HTTP Python
- [axios](https://axios-http.com/) - Requêtes HTTP JavaScript
- [WebSocket](https://developer.mozilla.org/fr/docs/Web/API/WebSocket) - WebSocket natif

---

## 🎉 **Conclusion**

L'intégration IA avec Fusion360-Web ouvre un monde de possibilités :

✅ **Génération automatique** d'objets 3D à partir de descriptions textuelles
✅ **Suggestions intelligentes** pour les opérations booléennes
✅ **Optimisation automatique** des scènes pour la performance ou la qualité
✅ **Création d'animations** complexes sans effort
✅ **Analyse et amélioration** des projets existants

Avec cette intégration, vous pouvez **automatiser** une grande partie du processus de modélisation 3D, rendant Fusion360-Web encore plus puissant et intuitif.

**À vous de jouer !** 🚀

---

*Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.*
