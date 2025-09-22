# OrthoIQ Agents - Claude Code Memory

## Project Overview

This project implements a comprehensive multi-agent system for orthopedic recovery management, featuring:

- **5 Specialized AI Agents**: Each with unique expertise in orthopedic recovery
- **Token Economics**: Blockchain-based reward system for agent performance
- **Recovery Metrics**: Comprehensive patient journey tracking
- **CDP AgentKit Integration**: Base blockchain functionality
- **Multi-agent Coordination**: Collaborative care planning

## Architecture

### Core Agents
1. **TriageAgent** (`src/agents/triage-agent.js`)
   - Master coordinator for case routing
   - Urgency assessment and specialist recommendation
   - Case progress monitoring

2. **PainWhispererAgent** (`src/agents/pain-whisperer-agent.js`)
   - Pain assessment and management specialist
   - Multimodal pain intervention strategies
   - Pain psychology and coping strategies

3. **MovementDetectiveAgent** (`src/agents/movement-detective-agent.js`)
   - Biomechanics and movement analysis expert
   - Gait analysis and movement dysfunction identification
   - Movement pattern correction strategies

4. **StrengthSageAgent** (`src/agents/strength-sage-agent.js`)
   - Functional restoration and rehabilitation specialist
   - Progressive rehabilitation program design
   - Return-to-activity protocols

5. **MindMenderAgent** (`src/agents/mind-mender-agent.js`)
   - Psychological aspects of recovery specialist
   - Fear-avoidance behavior modification
   - Coping strategies and adherence optimization

### Core Infrastructure
- **BaseAgent** (`src/agents/base-agent.js`): Foundation class with token economics
- **AgentCoordinator** (`src/utils/agent-coordinator.js`): Multi-agent orchestration
- **TokenManager** (`src/utils/token-manager.js`): Blockchain token reward system
- **RecoveryMetrics** (`src/utils/recovery-metrics.js`): Patient progress tracking
- **BlockchainUtils** (`src/utils/blockchain-utils.js`): Base blockchain integration

### API Server
- **Main Entry** (`src/index.js`): Express.js API server with full REST endpoints
- **Configuration** (`src/config/agent-config.js`): Centralized configuration management

## Token Economics System

Agents earn tokens based on:
- **Medical Outcomes**: Pain reduction, functional improvement, patient satisfaction
- **Collaboration**: Multi-agent consultations and care coordination
- **Innovation**: Novel approaches and exceptional outcomes
- **Efficiency**: Timeline adherence and resource optimization

## Key Features

### Recovery-Focused Approach
- Timeline-based recovery phases (acute, inflammatory, proliferation, maturation)
- Functional goal setting and milestone tracking
- Risk stratification and early intervention protocols
- Patient empowerment and education strategies

### Blockchain Integration
- CDP AgentKit for Base blockchain connectivity
- Token contracts for agent rewards
- Medical outcome recording with privacy protection
- Reputation scoring and verification systems

### Multi-agent Coordination
- Intelligent case routing based on symptoms and complexity
- Specialist consultation synthesis and recommendation integration
- Load balancing and performance optimization
- Quality scoring and continuous improvement

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run example scenario
npm run example

# Start production server
npm start

# Lint code
npm run lint
```

## Testing Infrastructure

Comprehensive test suite covering:
- **Unit Tests**: Individual agent functionality (`tests/agent.test.js`)
- **Blockchain Tests**: Token economics and blockchain integration (`tests/blockchain.test.js`)
- **Coordination Tests**: Multi-agent workflows (`tests/coordination.test.js`)
- **Integration Examples**: End-to-end recovery scenarios (`examples/recovery-scenario.js`)

## Configuration

Key environment variables:
- `CDP_API_KEY_NAME`, `CDP_API_KEY_PRIVATE_KEY`: Coinbase Developer Platform credentials
- `CLAUDE_API_KEY`: Anthropic Claude API key
- `NETWORK_ID`: Blockchain network (base-sepolia for testing)
- `ENABLE_BLOCKCHAIN`: Toggle blockchain functionality
- `LOG_LEVEL`: Logging verbosity (debug, info, error)

## API Endpoints

### Health & Status
- `GET /health`: System health check
- `GET /status`: Detailed system status
- `GET /docs`: API documentation

### Core Functionality
- `POST /triage`: Triage patient cases
- `POST /consultation`: Multi-specialist consultations
- `POST /recovery/start`: Begin recovery tracking
- `POST /recovery/update`: Update progress
- `POST /recovery/complete`: Complete recovery

### Agent-Specific
- `POST /agents/:agentType/assess`: Direct agent assessments
- `GET /tokens/balance/:agentId`: Token balances
- `GET /tokens/statistics`: Network statistics

## Next Steps for Enhancement

1. **Real API Key Configuration**: Replace placeholder keys with actual credentials
2. **Production Blockchain**: Switch from test to mainnet for production
3. **Advanced NLP**: Enhance symptom analysis with medical NLP models
4. **Real-time Monitoring**: Add websocket support for live progress tracking
5. **ML Integration**: Implement predictive analytics for recovery outcomes
6. **FHIR Integration**: Connect with standard medical record systems

## File Structure Summary

```
orthoiq-agents/
├── src/
│   ├── agents/           # All 5 specialized agents
│   ├── config/           # Configuration management
│   ├── utils/            # Core infrastructure utilities
│   └── index.js          # Main API server
├── tests/                # Comprehensive test suite
├── examples/             # Demo scenarios
├── logs/                 # Application logs
└── docs/                 # Documentation
```

This system demonstrates advanced multi-agent coordination with real-world token economics, providing a robust foundation for orthopedic recovery management applications.