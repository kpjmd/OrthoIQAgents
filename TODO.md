# OrthoIQ Agents - TODO

## High Priority

### Deployment & Infrastructure
- [ ] Deploy to Railway with mock blockchain
- [ ] Set up production logging and monitoring
- [ ] Configure environment variables for production
- [ ] Set up error tracking (Sentry or similar)

### Token Economics & Blockchain
- [ ] Design OIQ token economics (supply, distribution, rewards)
- [ ] Deploy OIQ token contract to Base Sepolia testnet
- [ ] Create CDP AgentKit wallets for each agent
- [ ] Test token distribution and prediction staking on testnet
- [ ] Audit token contract (optional but recommended)
- [ ] Deploy to Base Mainnet

---

## Medium Priority

### Agent Intelligence Improvements

#### MindMender Smart Routing (Option 2)
**Status**: Option 1 implemented (keyword detection)
**Next Step**: Implement context-aware detection

Create dedicated `shouldIncludeMindMender()` method with:
- Explicit psychological indicators
- Chronic pain detection (>3 months duration)
- Sleep disturbance patterns
- Re-injury/recurring injury detection
- Athlete return-to-sport anxiety
- Post-surgical recovery anxiety
- High pain level threshold (>7/10)

**File**: `src/agents/triage-agent.js`
**Reference**: Lines 744-769, 984-1008

#### Smart Routing Enhancements
- [ ] Improve specialist selection accuracy based on symptom patterns
- [ ] Add specialist load balancing
- [ ] Implement specialist performance scoring

### Prediction Market
- [ ] Add persistent storage for predictions (database or on-chain)
- [ ] Implement prediction accuracy tracking over time
- [ ] Add stake adjustment based on agent reputation
- [ ] Create prediction market analytics dashboard

### Recovery Metrics
- [ ] Add milestone tracking persistence
- [ ] Implement outcome prediction models
- [ ] Create patient progress visualization
- [ ] Add comparative outcome analytics

---

## Low Priority

### Testing & Quality
- [ ] Add comprehensive unit tests for all agents
- [ ] Add integration tests for multi-agent coordination
- [ ] Add end-to-end tests for complete consultation flow
- [ ] Set up CI/CD pipeline

### Documentation
- [ ] Create API documentation (Swagger/OpenAPI)
- [ ] Add agent behavior documentation
- [ ] Create deployment guide
- [ ] Add architecture diagrams

### Features
- [ ] Add real-time consultation status updates (WebSockets)
- [ ] Implement consultation history search
- [ ] Add agent performance leaderboard
- [ ] Create admin dashboard for system monitoring

### Frontend Integration
- [ ] Verify MD review queue workflow
- [ ] Test milestone follow-up UI
- [ ] Add agent response streaming
- [ ] Implement real-time token balance display

---

## Completed ✅

- [x] Multi-agent coordination system
- [x] Token economics foundation (mock blockchain)
- [x] Prediction market (inter-agent, MD review, user modal)
- [x] Recovery metrics tracking
- [x] Fast mode consultations
- [x] MD review auto-flagging (3+ specialists, 70% confidence)
- [x] MindMender keyword detection (Option 1)
- [x] Feedback modal integration
- [x] Milestone follow-up structure

---

## Ideas / Future Considerations

- Voice-based consultation input
- Image analysis for injury assessment
- Integration with wearable devices for recovery tracking
- Multi-language support
- FHIR integration for medical record systems
- Telemedicine video consultation integration
- Mobile app for patient tracking
- Provider dashboard for MD review workflow

---

## Notes

- Server restarts currently reset token balances (in-memory)
- Prediction staking requires persistent blockchain wallets
- MindMender routing needs monitoring after Option 1 deployment
- Consider A/B testing for specialist routing algorithms
