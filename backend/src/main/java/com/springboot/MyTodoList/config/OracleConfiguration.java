package com.springboot.MyTodoList.config;

import oracle.jdbc.pool.OracleDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.SQLException;

/**
 * Configures the Oracle DataSource.
 *
 * Resolution order (first non-empty value wins):
 *   1. Env vars set by Kubernetes (db_url, db_user, dbpassword, driver_class_name)
 *   2. application.properties / application-local.properties values
 *
 * This means the app works locally without any env vars as long as
 * application-local.properties provides the datasource values.
 */
@Configuration
public class OracleConfiguration {

    Logger logger = LoggerFactory.getLogger(OracleConfiguration.class);

    @Value("${db_url:${spring.datasource.url}}")
    private String dbUrl;

    @Value("${db_user:${spring.datasource.username}}")
    private String dbUser;

    @Value("${dbpassword:${spring.datasource.password}}")
    private String dbPassword;

    @Value("${driver_class_name:${spring.datasource.driver-class-name:oracle.jdbc.OracleDriver}}")
    private String driverClassName;

    @Bean
    public DataSource dataSource() throws SQLException {
        logger.info("Configuring OracleDataSource");
        logger.info("Driver:   {}", driverClassName);
        logger.info("URL:      {}", dbUrl);
        logger.info("Username: {}", dbUser);

        OracleDataSource ds = new OracleDataSource();
        ds.setDriverType(driverClassName);
        ds.setURL(dbUrl);
        ds.setUser(dbUser);
        ds.setPassword(dbPassword);
        return ds;
    }
}
