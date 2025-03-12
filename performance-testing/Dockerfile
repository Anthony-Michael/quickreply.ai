FROM openjdk:11-slim

# Set JMeter version
ENV JMETER_VERSION 5.5
ENV JMETER_HOME /opt/apache-jmeter-${JMETER_VERSION}
ENV JMETER_BIN ${JMETER_HOME}/bin
ENV PATH ${JMETER_BIN}:${PATH}

# Install required packages
RUN apt-get update && \
    apt-get install -y wget unzip \
    && rm -rf /var/lib/apt/lists/*

# Download and extract JMeter
RUN mkdir -p /opt \
    && wget -q https://downloads.apache.org/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz -O /tmp/apache-jmeter-${JMETER_VERSION}.tgz \
    && tar -xzf /tmp/apache-jmeter-${JMETER_VERSION}.tgz -C /opt \
    && rm /tmp/apache-jmeter-${JMETER_VERSION}.tgz

# Download JMeter plugins manager
RUN wget -q https://jmeter-plugins.org/get/ -O ${JMETER_HOME}/lib/ext/jmeter-plugins-manager.jar \
    && wget -q https://search.maven.org/remotecontent?filepath=kg/apc/cmdrunner/2.2/cmdrunner-2.2.jar -O ${JMETER_HOME}/lib/cmdrunner-2.2.jar \
    && java -cp ${JMETER_HOME}/lib/ext/jmeter-plugins-manager.jar org.jmeterplugins.repository.PluginManagerCMDInstaller

# Install plugins
RUN ${JMETER_HOME}/bin/PluginsManagerCMD.sh install jpgc-casutg jpgc-dummy jpgc-graphs-basic jpgc-graphs-additional jpgc-graphs-composite

# Set working directory
WORKDIR /jmeter

# Copy test plans
COPY *.jmx /jmeter/
COPY *.csv /jmeter/

# Set entrypoint for running tests
ENTRYPOINT ["jmeter"]

# Default command runs the test plan in non-GUI mode
CMD ["-n", "-t", "email-composer-load-test.jmx", "-l", "results.jtl", "-e", "-o", "/jmeter/results"] 