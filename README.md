# Mattermost AI Slash Command Worker

Yet another project that integrates an AI-powered response system for Mattermost slash commands [[7]][[8]].

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
This repository contains a Cloudflare Worker that processes Mattermost slash commands using an AI model (Llama-3.1-8B) to generate responses. It provides a seamless way to integrate AI-driven answers directly into Mattermost channels [[1]][[3]].

---

## Features
- **AI-Powered Responses**: Uses the Llama-3.1-8B model to answer questions concisely [[9]].
- **Slash Command Support**: Processes `/command` inputs from Mattermost.
- **Input Validation**: Ensures valid questions are provided before processing [[2]].
- **Cross-Format Compatibility**: Handles both JSON and form-data payloads [[7]].
- **Error Handling**: Graceful error messages for invalid inputs or AI failures [[6]].

---

## Installation & Setup

### Prerequisites
1. [Cloudflare Account](https://dash.cloudflare.com) with Workers enabled.
2. [Mattermost Server](https://mattermost.com/) configured with slash commands.
3. [Cloudflare AI Model](https://cloudflare.com/ai) access (`@cf/meta/llama-3.1-8b-instruct-fp8`).

### Steps
1. **Deploy Worker**:
   ```bash
   # Clone repository
   git clone https://github.com/your-repo.git [[6]]
   # Deploy to Cloudflare
   wrangler deploy
