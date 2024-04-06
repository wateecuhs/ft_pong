# Set base image (host OS)
FROM python:3.12-alpine

# By default, listen on port 5000
EXPOSE 5000

# Set the working directory in the container
WORKDIR /app

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install any dependencies
RUN pip install -r requirements.txt

ENV test=${HOME}

# Copy the content of the local src directory to the working directory
COPY ./assets ./assets
COPY ./js ./js
COPY ./styles ./styles
COPY ./templates ./templates
COPY *.py ./

# Specify the command to run on container start
CMD [ "python3", "./app.py" ]