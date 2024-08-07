# Use the official Tomcat image as a parent image
FROM tomcat:9-jdk11-openjdk

WORKDIR /usr/local/tomcat/webapps/

# Remove the default Tomcat applications and replace with built war file
RUN rm -rf *
COPY build/libs/banana-1.6.17.war ./ROOT.war

# Expose the default Tomcat port
EXPOSE 8080

# Start Tomcat
CMD ["catalina.sh", "run"]
