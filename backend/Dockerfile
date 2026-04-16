FROM openjdk:22-jdk
WORKDIR /app
EXPOSE 8080
COPY target/MyTodoList-0.0.1-SNAPSHOT.jar MyTodoList.jar
COPY wallet /app/wallet
ENTRYPOINT ["java","-Doracle.net.tns_admin=/app/wallet","-jar","MyTodoList.jar"]