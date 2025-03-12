#!/bin/bash

# Setup script for QuickReply.ai performance testing environment

# Exit on error
set -e

echo "=================================================="
echo "   QuickReply.ai Performance Testing Setup"
echo "=================================================="
echo ""

# Check for required tools
echo "Checking prerequisites..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. It's recommended for resource monitoring."
    echo "Visit https://nodejs.org to install."
    echo ""
else
    NODE_VERSION=$(node --version)
    echo "✓ Node.js is installed (${NODE_VERSION})"
fi

# Check for Java (required for JMeter)
if ! command -v java &> /dev/null; then
    echo "Java is not installed. It's required to run JMeter locally."
    echo "Visit https://adoptopenjdk.net to install Java 8 or higher."
    echo ""
else
    JAVA_VERSION=$(java -version 2>&1 | head -1)
    echo "✓ Java is installed (${JAVA_VERSION})"
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. It's an alternative way to run JMeter."
    echo "Visit https://www.docker.com/products/docker-desktop to install."
    echo ""
else
    DOCKER_VERSION=$(docker --version)
    echo "✓ Docker is installed (${DOCKER_VERSION})"
fi

echo ""
echo "Setup options:"
echo "1) Install JMeter locally"
echo "2) Build Docker image for JMeter"
echo "3) Install both"
echo "4) Skip installation (if already installed)"
echo ""
read -p "Choose an option (1-4): " SETUP_OPTION

case $SETUP_OPTION in
    1|3)
        echo ""
        echo "Installing JMeter locally..."
        
        # Create temp directory
        mkdir -p temp
        cd temp
        
        # Download JMeter
        JMETER_VERSION=5.5
        echo "Downloading Apache JMeter ${JMETER_VERSION}..."
        curl -L https://downloads.apache.org/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz -o apache-jmeter-${JMETER_VERSION}.tgz
        
        # Extract JMeter
        echo "Extracting JMeter..."
        tar -xzf apache-jmeter-${JMETER_VERSION}.tgz
        
        # Ask for installation directory
        echo ""
        read -p "Enter installation directory [${HOME}/apache-jmeter-${JMETER_VERSION}]: " INSTALL_DIR
        INSTALL_DIR=${INSTALL_DIR:-${HOME}/apache-jmeter-${JMETER_VERSION}}
        
        # Move JMeter to installation directory
        echo "Installing JMeter to ${INSTALL_DIR}..."
        mkdir -p "${INSTALL_DIR}"
        cp -R apache-jmeter-${JMETER_VERSION}/* "${INSTALL_DIR}/"
        
        # Clean up
        cd ..
        rm -rf temp
        
        # Add JMeter to PATH
        echo ""
        echo "To add JMeter to your PATH, add the following line to your shell profile:"
        echo "export PATH=\"${INSTALL_DIR}/bin:\$PATH\""
        echo ""
        echo "Would you like to add this to your shell profile automatically?"
        read -p "Enter Y/N: " ADD_TO_PATH
        
        if [[ "${ADD_TO_PATH}" == "Y" || "${ADD_TO_PATH}" == "y" ]]; then
            SHELL_PROFILE=""
            if [[ -f "${HOME}/.bash_profile" ]]; then
                SHELL_PROFILE="${HOME}/.bash_profile"
            elif [[ -f "${HOME}/.zprofile" ]]; then
                SHELL_PROFILE="${HOME}/.zprofile"
            elif [[ -f "${HOME}/.profile" ]]; then
                SHELL_PROFILE="${HOME}/.profile"
            elif [[ -f "${HOME}/.bashrc" ]]; then
                SHELL_PROFILE="${HOME}/.bashrc"
            elif [[ -f "${HOME}/.zshrc" ]]; then
                SHELL_PROFILE="${HOME}/.zshrc"
            fi
            
            if [[ -n "${SHELL_PROFILE}" ]]; then
                echo "export PATH=\"${INSTALL_DIR}/bin:\$PATH\"" >> "${SHELL_PROFILE}"
                echo "✓ Added JMeter to PATH in ${SHELL_PROFILE}"
                echo "Please restart your terminal or run 'source ${SHELL_PROFILE}' to apply changes."
            else
                echo "Could not determine shell profile. Please add the PATH manually."
            fi
        fi
        
        echo "✓ JMeter installation complete!"
        ;;
    2|3)
        echo ""
        echo "Building Docker image for JMeter..."
        
        if ! command -v docker &> /dev/null; then
            echo "Error: Docker is not installed. Cannot build Docker image."
            echo "Please install Docker and try again."
            exit 1
        fi
        
        # Build Docker image
        docker build -t jmeter:latest .
        
        echo "✓ Docker image built successfully!"
        ;;
    4)
        echo "Skipping installation."
        ;;
    *)
        echo "Invalid option. Skipping installation."
        ;;
esac

# Make scripts executable
chmod +x run-performance-tests.sh

echo ""
echo "Creating results directory..."
mkdir -p results

echo ""
echo "Setup complete! You can now run the performance tests with:"
echo "./run-performance-tests.sh"
echo ""
echo "For more information, see the README.md file."
echo "==================================================" 