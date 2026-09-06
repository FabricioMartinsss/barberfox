const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

async function request(path) {
  return fetch(new URL(path, baseUrl), { redirect: "manual" });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const protectedRoutes = ["/admin", "/admin/rota-de-teste"];

for (const path of protectedRoutes) {
  const response = await request(path);
  assert(response.status === 307, `${path} deveria redirecionar, recebeu ${response.status}`);
  assert(
    response.headers.get("location") === "/admin/login",
    `${path} deveria redirecionar para /admin/login`,
  );
}

const loginResponse = await request("/admin/login");
const loginPage = await loginResponse.text();

assert(loginResponse.status === 200, `login deveria responder 200, recebeu ${loginResponse.status}`);
assert(loginPage.includes("Acesso administrativo"), "página de login não foi renderizada");
assert(loginPage.includes('type="password"'), "campo de senha não foi renderizado");

console.log(`Auth smoke OK: redirects e login em ${baseUrl}`);
