#!/usr/bin/env python3
"""
Exemple d'agent IA pour Fusion360-Web

Ce script montre comment créer un agent IA simple qui peut être connecté
au logiciel Fusion360-Web pour générer des objets 3D, suggérer des opérations,
et optimiser des scènes.

Pour l'utiliser:
1. Installez les dépendances: pip install fastapi uvicorn python-multipart
2. Lancez le serveur: python example-ai-agent.py
3. Dans Fusion360-Web, configurez l'URL de l'API: http://localhost:8000
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import uuid
import time
from datetime import datetime

app = FastAPI(
    title="Fusion360-Web AI Agent",
    description="Agent IA pour la modélisation 3D procédurale",
    version="1.0.0"
)

# Configurer CORS pour permettre les requêtes depuis le navigateur
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Modèles de données
class AIRequest(BaseModel):
    prompt: str
    context: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None


class AIResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    geometry: Optional[Dict[str, Any]] = None
    operations: Optional[List[Dict[str, Any]]] = None


# Base de connaissances pour les objets 3D
OBJECT_TEMPLATES = {
    "cube": {
        "type": "box",
        "width": 1,
        "height": 1,
        "depth": 1
    },
    "sphere": {
        "type": "sphere",
        "diameter": 1,
        "segments": 32
    },
    "cylinder": {
        "type": "cylinder",
        "diameter": 1,
        "height": 1,
        "tessellation": 24
    },
    "torus": {
        "type": "torus",
        "diameter": 2,
        "width": 0.5,
        "tessellation": 24,
        "subdivisions": 12
    },
    "cone": {
        "type": "cone",
        "diameter": 1,
        "height": 1,
        "tessellation": 24
    }
}


@app.post("/api/ai", response_model=AIResponse)
async def handle_ai_request(request: AIRequest):
    """
    Point d'entrée principal pour les requêtes IA
    """
    try:
        # Analyser le type de requête
        req_type = request.parameters.get("type") if request.parameters else None
        
        if req_type == "object":
            return await generate_object(request)
        elif req_type == "boolean_suggestion":
            return suggest_boolean_operation(request)
        elif req_type == "optimization":
            return optimize_scene(request)
        elif req_type == "animation":
            return generate_animation(request)
        elif req_type == "analysis":
            return analyze_project(request)
        else:
            # Requête générique
            return generate_from_prompt(request)
            
    except Exception as e:
        return AIResponse(
            success=False,
            message=f"Erreur: {str(e)}"
        )


async def generate_object(request: AIRequest) -> AIResponse:
    """
    Génère un objet 3D à partir d'un prompt
    """
    prompt = request.prompt.lower()
    
    # Rechercher des mots-clés
    if "cube" in prompt or "boîte" in prompt or "carré" in prompt:
        geometry = OBJECT_TEMPLATES["cube"].copy()
    elif "sphère" in prompt or "boule" in prompt or "bille" in prompt:
        geometry = OBJECT_TEMPLATES["sphere"].copy()
    elif "cylindre" in prompt or "tube" in prompt:
        geometry = OBJECT_TEMPLATES["cylinder"].copy()
    elif "tore" in prompt or "donut" in prompt or "anneau" in prompt:
        geometry = OBJECT_TEMPLATES["torus"].copy()
    elif "cône" in prompt or "pyramide" in prompt:
        geometry = OBJECT_TEMPLATES["cone"].copy()
    else:
        # Par défaut, créer un cube
        geometry = OBJECT_TEMPLATES["cube"].copy()
    
    # Personnaliser selon le prompt
    if "grand" in prompt or "large" in prompt:
        for dim in ["width", "height", "depth", "diameter"]:
            if dim in geometry:
                geometry[dim] = float(geometry[dim]) * 2
    
    if "petit" in prompt or "small" in prompt:
        for dim in ["width", "height", "depth", "diameter"]:
            if dim in geometry:
                geometry[dim] = float(geometry[dim]) * 0.5
    
    return AIResponse(
        success=True,
        message=f"Objet généré: {request.prompt}",
        geometry=geometry
    )


def suggest_boolean_operation(request: AIRequest) -> AIResponse:
    """
    Suggère une opération booléenne entre des objets
    """
    objects = request.parameters.get("objects", [])
    
    if len(objects) < 2:
        return AIResponse(
            success=False,
            message="Au moins 2 objets sont requis"
        )
    
    # Logique simple de suggestion
    # Dans une implémentation réelle, on utiliserait un modèle d'IA
    obj_a = objects[0]
    obj_b = objects[1]
    
    # Si les objets sont proches, suggérer une union ou soustraction
    operation = "union"
    
    # Si un objet est beaucoup plus petit, suggérer une soustraction
    if obj_a.get("type") == "cylinder" and obj_b.get("type") == "box":
        operation = "subtraction"
    
    return AIResponse(
        success=True,
        message=f"Opération suggérée: {operation}",
        data={
            "operation": operation,
            "objAId": obj_a.get("id"),
            "objBId": obj_b.get("id")
        }
    )


def optimize_scene(request: AIRequest) -> AIResponse:
    """
    Optimise une scène 3D
    """
    scene_data = request.parameters.get("scene", {})
    criteria = request.parameters.get("criteria", "performance")
    
    # Dans une implémentation réelle, on analyserait la scène
    # et on appliquerait des optimisations
    
    optimized_scene = {
        **scene_data,
        "optimized": True,
        "criteria": criteria,
        "message": f"Scène optimisée pour {criteria}"
    }
    
    return AIResponse(
        success=True,
        message=f"Scène optimisée pour {criteria}",
        data={
            "optimizedScene": optimized_scene
        }
    )


def generate_animation(request: AIRequest) -> AIResponse:
    """
    Génère une animation
    """
    objects = request.parameters.get("objects", [])
    duration = request.parameters.get("duration", 5)
    
    if not objects:
        return AIResponse(
            success=False,
            message="Aucun objet spécifié"
        )
    
    # Créer une animation simple
    animation = {
        "id": f"anim-{uuid.uuid4()}",
        "name": f"Animation auto: {request.prompt}",
        "duration": duration,
        "tracks": [
            {
                "target": objects[0],
                "property": "position",
                "keyframes": [
                    {"time": 0, "value": {"x": 0, "y": 0, "z": 0}},
                    {"time": duration / 2, "value": {"x": 5, "y": 0, "z": 0}},
                    {"time": duration, "value": {"x": 0, "y": 0, "z": 0}}
                ]
            }
        ]
    }
    
    return AIResponse(
        success=True,
        message=f"Animation générée: {request.prompt}",
        data={
            "animation": animation
        }
    )


def analyze_project(request: AIRequest) -> AIResponse:
    """
    Analyse un projet et suggère des améliorations
    """
    project_data = request.parameters.get("project", {})
    
    suggestions = [
        {
            "type": "info",
            "description": "Votre projet contient plusieurs objets intéressants",
            "action": None
        },
        {
            "type": "optimization",
            "description": "Vous pourriez optimiser les objets similaires en utilisant des instances",
            "action": {
                "type": "optimize_instances"
            }
        },
        {
            "type": "suggestion",
            "description": "Essayez d'utiliser des opérations booléennes pour créer des formes complexes",
            "action": {
                "type": "suggest_boolean"
            }
        }
    ]
    
    return AIResponse(
        success=True,
        message=f"Analyse du projet terminée",
        data={
            "suggestions": suggestions
        }
    )


def generate_from_prompt(request: AIRequest) -> AIResponse:
    """
    Génère une réponse à partir d'un prompt générique
    """
    prompt = request.prompt.lower()
    
    # Essayer de comprendre l'intention
    if any(word in prompt for word in ["créer", "générer", "faire", "construire"]):
        return generate_object(request)
    elif any(word in prompt for word in ["union", "soustraction", "intersection", "booléen"]):
        return suggest_boolean_operation(request)
    elif any(word in prompt for word in ["optimiser", "améliorer", "meilleur"]):
        return optimize_scene(request)
    elif any(word in prompt for word in ["animer", "animation", "mouvement"]):
        return generate_animation(request)
    else:
        return AIResponse(
            success=True,
            message=f"J'ai compris: {request.prompt}",
            data={
                "understood": True,
                "intent": "unknown"
            }
        )


@app.get("/api/health")
async def health_check():
    """Vérifie que l'API fonctionne"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


@app.get("/api/capabilities")
async def get_capabilities():
    """Retourne les capacités de l'agent IA"""
    return {
        "name": "Fusion360-Web AI Agent",
        "version": "1.0.0",
        "capabilities": [
            "generate_objects",
            "suggest_boolean_operations",
            "optimize_scenes",
            "generate_animations",
            "analyze_projects"
        ],
        "models": ["default"],
        "description": "Agent IA pour la modélisation 3D procédurale"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
