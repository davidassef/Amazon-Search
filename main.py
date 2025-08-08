from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import json

app = FastAPI(title="LongLife Nutri Search API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock product data
MOCK_PRODUCTS = [
    {
        "id": 1,
        "name": "Whey Protein Premium",
        "description": "Proteína de alta qualidade para ganho de massa muscular",
        "price": 89.99,
        "category": "Proteínas",
        "image": "https://via.placeholder.com/300x200/4CAF50/white?text=Whey+Protein",
        "rating": 4.8,
        "reviews": 245
    },
    {
        "id": 2,
        "name": "BCAA 2:1:1",
        "description": "Aminoácidos essenciais para recuperação muscular",
        "price": 45.99,
        "category": "Aminoácidos",
        "image": "https://via.placeholder.com/300x200/2196F3/white?text=BCAA",
        "rating": 4.6,
        "reviews": 189
    },
    {
        "id": 3,
        "name": "Creatina Monohidratada",
        "description": "Suplemento para força e resistência muscular",
        "price": 35.99,
        "category": "Creatina",
        "image": "https://via.placeholder.com/300x200/FF9800/white?text=Creatina",
        "rating": 4.9,
        "reviews": 312
    },
    {
        "id": 4,
        "name": "Multivitamínico Premium",
        "description": "Complexo vitamínico completo para saúde geral",
        "price": 55.99,
        "category": "Vitaminas",
        "image": "https://via.placeholder.com/300x200/9C27B0/white?text=Vitaminas",
        "rating": 4.7,
        "reviews": 156
    },
    {
        "id": 5,
        "name": "Ômega 3 Ultra",
        "description": "Ácidos graxos essenciais para saúde cardiovascular",
        "price": 42.99,
        "category": "Ômegas",
        "image": "https://via.placeholder.com/300x200/00BCD4/white?text=Omega+3",
        "rating": 4.5,
        "reviews": 98
    },
    {
        "id": 6,
        "name": "Notebook Gamer Alto Desempenho",
        "description": "Notebook para jogos e trabalho pesado",
        "price": 2899.99,
        "category": "Eletrônicos",
        "image": "https://via.placeholder.com/300x200/607D8B/white?text=Notebook",
        "rating": 4.4,
        "reviews": 67
    }
]

@app.get("/")
async def root():
    return {"message": "LongLife Nutri Search API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "API is running"}

@app.get("/search")
async def search_products(query: Optional[str] = Query(None)):
    """
    Search for products based on query string
    """
    if not query:
        return {
            "success": False,
            "message": "Query parameter is required",
            "products": []
        }
    
    # Filter products that match the query (case insensitive)
    query_lower = query.lower()
    filtered_products = []
    
    for product in MOCK_PRODUCTS:
        if (query_lower in product["name"].lower() or 
            query_lower in product["description"].lower() or 
            query_lower in product["category"].lower()):
            filtered_products.append(product)
    
    return {
        "success": True,
        "query": query,
        "total": len(filtered_products),
        "products": filtered_products
    }

@app.get("/products/{product_id}")
async def get_product(product_id: int):
    """Get a specific product by ID"""
    product = next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)
    
    if not product:
        return {"success": False, "message": "Product not found"}
    
    return {"success": True, "product": product}

@app.get("/categories")
async def get_categories():
    """Get all available categories"""
    categories = list(set(p["category"] for p in MOCK_PRODUCTS))
    return {"success": True, "categories": categories}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
