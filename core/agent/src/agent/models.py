from pydantic import BaseModel

class AgentContext(BaseModel):
    context: str

class AgentResponse(BaseModel):
    response: str
