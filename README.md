# Mattermost AI Slash Command Worker

Yet another project that integrates an AI-powered response system for Mattermost slash commands.

![mattermost-bot-with-slash-command](https://raw.githubusercontent.com/javajammer/askmeanything/refs/heads/main/mattermost-chat-bot.jpeg)

---

## Table of Contents
1. [Description](#description)
2. [Features](#features)


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
