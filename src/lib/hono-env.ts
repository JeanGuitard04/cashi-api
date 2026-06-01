// Variables que el middleware de auth inyecta en el contexto de Hono.
// Routers protegidos se instancian como `new Hono<AppEnv>()` para que c.get('userId') sea typed.
export type AppEnv = {
  Variables: {
    userId: number
  }
}
