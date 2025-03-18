# Mattermost AI Slash Command Worker

Yet another project that integrates an AI-powered response system for Mattermost slash commands.

---

## Table of Contents
1. [Description](#description)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [Usage](#usage)
5. [Dependencies](#dependencies)
6. [Contributing](#contributing)
7. [License](#license)

---

## Description
This repository contains a Cloudflare Worker that processes Mattermost slash commands using an AI model (Llama-3.1-8B) to generate responses. It provides a seamless way to integrate AI-driven answers directly into Mattermost channels.

---

## Features
- **AI-Powered Responses**: Uses the Llama-3.1-8B model to answer questions concisely.
- **Slash Command Support**: Processes `/command` inputs from Mattermost.
- **Input Validation**: Ensures valid questions are provided before processing.
- **Cross-Format Compatibility**: Handles both JSON and form-data payloads.
- **Error Handling**: Graceful error messages for invalid inputs or AI failures.

---
