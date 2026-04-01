## Config Server (Spring Cloud Config)

This project adds a **Config Server** microservice so configuration is centralized for the backend.

### What was added
- **Microservice**: `backend/microservices/config-server`
- **Local config repo** (served by Config Server): `backend/microservices/config-repo/`

### Versions alignment
This `config-server` uses the same versions as your services that already run on Spring Boot 4 / Spring Cloud 2025:
- Spring Boot **4.0.2**
- Spring Cloud **2025.1.0**

Note: your `user` microservice is still on Spring Boot 2.7.x (uses `javax.*`). Migrating it to Boot 4 requires a larger refactor (`javax` → `jakarta`) so it was not changed here.

---

## Where configs are stored
Configs are in:
- `backend/microservices/config-repo/eureka.properties`
- `backend/microservices/config-repo/gateway.properties`
- `backend/microservices/config-repo/evaluation.properties`

Config Server serves them using the **native** backend (local filesystem).

---

## How services load config now
These services were updated to load config from the Config Server:
- `backend/eureka`
- `backend/gateway`
- `backend/microservices/evaluation`

Each now contains:
`spring.config.import=optional:configserver:http://localhost:8888`

`optional:` means they still start even if the config-server is not running.

---

## Run order (local)
1. Start Eureka:
   - `backend/eureka`
2. Start Config Server:
   - `backend/microservices/config-server` (port **8888**)
3. Start gateway + microservices:
   - gateway (8080)
   - evaluation (8020)
   - user (8011)

---

## Quick check
After starting config-server, you can verify it serves config:
- `http://localhost:8888/gateway/default`
- `http://localhost:8888/eureka/default`
- `http://localhost:8888/evaluation/default`

