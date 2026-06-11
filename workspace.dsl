workspace "COQUI_BOT" "Telegram-based task management system deployed on OCI" {

    !adrs doc/arch

    model {
        developer = person "Developer / Team Member" "Uses the React web UI and Telegram bot to manage tasks"
        telegramUser = person "Telegram User" "Interacts with the system via Telegram chat commands"
        admin = person "Admin" "Monitors system via developer insights dashboard"

        telegramAPI = softwareSystem "Telegram Bot API" "External messaging platform" "External"
        anthropicAPI = softwareSystem "Anthropic Claude API" "LLM API for AI chat and insights" "External"
        ociRegistry = softwareSystem "OCI Container Registry" "Stores Docker images" "External"

        coquiBot = softwareSystem "COQUI_BOT System" "Full-stack task manager with Telegram bot, React UI, and AI features" {

            reactSPA = container "React SPA" "Task management web interface with AI chat" "React 18 + Material UI" "Web Browser"
            springBoot = container "Spring Boot Application" "REST API + Telegram bot polling + AI integration" "Java22 / Spring Boot 3" {

                todoController = component "ToDoItemController" "REST endpoints for /todolist CRUD" "Spring MVC Controller" {
                    url "https://github.com/Elmunoz420/coqui-bot/blob/sprint5-emilio/docs/diagrams/controllers.puml"
                }
                userController = component "UserController" "REST endpoints for /users" "Spring MVC Controller" {
                    url "https://github.com/Elmunoz420/coqui-bot/blob/sprint5-emilio/docs/diagrams/controllers.puml"
                }
                aiController = component "AIInsightsController" "POST /api/ai/chat and developer insights" "Spring MVC Controller" {
                    url "https://github.com/Elmunoz420/coqui-bot/blob/sprint5-emilio/docs/diagrams/controllers.puml"
                }
                botConsumer = component "BotConsumer / BotActions" "Telegram long-polling loop and command dispatcher" "Spring Component" {
                    url "https://github.com/Elmunoz420/coqui-bot/blob/sprint5-emilio/docs/diagrams/bot.puml"
                }
                taskService = component "ToDoItemService" "Business logic: Tarea to ToDoItem translation" "Spring Service" {
                    url "https://github.com/Elmunoz420/coqui-bot/blob/sprint5-emilio/docs/diagrams/services.puml"
                }
                oracleConfig = component "OracleConfiguration" "DataSource and UCP connection pool" "Spring Configuration" {
                    url "https://github.com/Elmunoz420/coqui-bot/blob/sprint5-emilio/docs/diagrams/config.puml"
                }
                securityConfig = component "SecurityConfig" "Spring Security session-based auth, BCrypt" "Spring Security" {
                    url "https://github.com/Elmunoz420/coqui-bot/blob/sprint5-emilio/docs/diagrams/config.puml"
                }
                spaForward = component "SpaForwardController" "Serves React SPA for all non-API routes" "Spring MVC Controller" {
                    url "https://github.com/Elmunoz420/coqui-bot/blob/sprint5-emilio/docs/diagrams/config.puml"
                }
            }
            oracleATP = container "Oracle ATP" "Autonomous Transaction Processing DB. Tables: TAREA, USUARIO, PROYECTO." "Oracle 19c / ATP Always Free" "Database"

            reactSPA -> springBoot "REST API calls" "HTTP/REST"
            springBoot -> oracleATP "JDBC/UCP queries" "JDBC"
            todoController -> taskService "delegates"
            taskService -> oracleATP "queries database" "JDBC"
            aiController -> anthropicAPI "POST /v1/messages" "HTTPS"
            botConsumer -> taskService "delegates task operations"
            botConsumer -> anthropicAPI "AI requests" "HTTPS"
            oracleConfig -> oracleATP "configures connection pool"
        }

        developer -> reactSPA "Uses via browser"
        telegramUser -> telegramAPI "Sends commands"
        admin -> reactSPA "Views developer dashboard"
        telegramAPI -> botConsumer "Delivers updates via long-poll" "HTTPS"
        botConsumer -> telegramAPI "Sends responses" "HTTPS"

        deploymentEnvironment "OCI Production" {
            deploymentNode "Oracle Cloud Infrastructure" {
                deploymentNode "OKE Cluster mx-queretaro-1" {
                    deploymentNode "Namespace mtdrworkshop" {
                        deploymentNode "Pod x2 replicas" "todolistapp-springboot-deployment" {
                            containerInstance springBoot
                        }
                        deploymentNode "LoadBalancer Service port 80" {
                            infrastructureNode "OCI Load Balancer" "Routes port 80 to 8080"
                        }
                    }
                }
                deploymentNode "Oracle ATP Always Free" {
                    containerInstance oracleATP
                }
                deploymentNode "OCIR mx-queretaro-1" {
                    infrastructureNode "agileimage 0.1" "Docker image stored in OCI Container Registry"
                }
            }
            deploymentNode "User Devices" {
                deploymentNode "Web Browser" {
                    containerInstance reactSPA
                }
            }
        }
    }

    views {
        systemLandscape "SystemLandscape" "All systems and actors" {
            include *
            autoLayout
        }

        systemContext coquiBot "SystemContext" "COQUI_BOT and its external dependencies" {
            include *
            autoLayout
        }

        container coquiBot "Containers" "Internal containers of COQUI_BOT" {
            include *
            autoLayout
        }

        component springBoot "Components" "Internal components of the Spring Boot application" {
            include *
            autoLayout
        }

        deployment coquiBot "OCI Production" "Deployment" "Production deployment on OKE" {
            include *
            autoLayout
        }

        dynamic springBoot "DynamicTelegramTask" "User creates a task via Telegram" {
            botConsumer -> taskService "createTask"
            taskService -> oracleATP "queries database"
            autoLayout
        }

        dynamic springBoot "DynamicAIChat" "Developer requests AI insights via React UI" {
            aiController -> anthropicAPI "POST /v1/messages Claude Sonnet"
            anthropicAPI -> aiController "Returns AI response"
            autoLayout
        }

        styles {
            element "Person" {
                shape Person
                background #1168bd
                color #ffffff
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "External" {
                background #999999
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "Database" {
                shape Cylinder
                background #f5a623
                color #ffffff
            }
            element "Web Browser" {
                shape WebBrowser
            }
            element "Component" {
                background #85bbf0
                color #000000
            }
        }
    }
}
