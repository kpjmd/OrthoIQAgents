# Changelog

All notable changes to the OrthoIQ Agents project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Railway deployment with production configuration
- Base Sepolia testnet integration
- OIQ token contract deployment
- Persistent prediction storage

---

## [0.3.0] - 2025-12-28

### Added
- **MD Review Auto-Flagging**: Consultations with 3+ specialists and 70%+ confidence automatically flagged for MD review
- **Enhanced MindMender Routing**: Added detection for chronic conditions, sleep issues, athlete anxiety, post-surgical recovery, and re-injury concerns
- **Debug Logging**: MD review quality checks now log specialist count, confidence, and predicted accuracy
- **TODO.md**: Project task tracking and future enhancements
- **CHANGELOG.md**: This changelog file

### Changed
- **MD Review Threshold**: Lowered from 4+ to 3+ specialists (excluding triage) to better match orthopedic consultation patterns
- **Confidence Threshold**: Lowered from 90% to 70% for early platform testing and better MD review coverage
- **MindMender Keywords**: Expanded detection to include: chronic, sleep, scared, nervous, athlete, sport, surgery, post-op, re-injury, recurring

### Fixed
- **Specialist Count Bug**: MD review check now correctly excludes triage from specialist count
- **Frontend API Endpoint**: Updated to `/api/consultations/{id}/flag-for-review` (frontend fix completed)
- **Token Balance Persistence**: Documented limitation - requires blockchain integration for production

### Technical Details
- Modified `src/index.js`: Added `shouldFlagForMDReview()` and `flagConsultationForMDReview()` helper functions
- Modified `src/agents/triage-agent.js`: Enhanced `extractSpecialistRecommendations()` and `canInferSpecialistNeeds()` methods
- Quality thresholds: 3+ specialists AND (confidence > 0.7 OR predicted accuracy > 0.85)

---

## [0.2.0] - 2025-12-26

### Added
- **Prediction Market**: Inter-agent prediction system with token staking
- **Three Resolution Types**: Inter-agent consensus, MD review validation, user feedback integration
- **Cascading Resolution**: User feedback resolves all participating agents, not just triage
- **Consultation Metadata**: Added prediction accuracy and quality scoring

### Changed
- **Token Distribution**: Consultation payments now distributed to all participating specialists
- **Prediction Stakes**: Agents stake tokens on predicted outcomes (currently 0 due to fresh wallets)

### Fixed
- **ConsultationId Mismatch**: Properly passed from index.js to agent-coordinator.js
- **Prediction Staking**: Fixed balance retrieval from tokenManager instead of agent object

---

## [0.1.0] - 2025-10-15

### Added
- **Initial Release**: Multi-agent orthopedic recovery system
- **5 Specialized Agents**: Triage, Pain Whisperer, Movement Detective, Strength Sage, Mind Mender
- **Token Economics Foundation**: Mock blockchain with CDP AgentKit integration
- **Recovery Metrics**: Patient journey tracking with milestone support
- **Multi-Agent Coordination**: Collaborative care planning and synthesis
- **Fast Mode**: Immediate triage response with background specialist coordination
- **Dual-Track Mode**: Enhanced symptom extraction and body part detection
- **REST API**: Express.js server with comprehensive endpoints

### Technical
- Agent base class with token wallet integration
- Prediction market infrastructure
- Recovery metrics tracking system
- Cache manager for consultation results
- Prompt manager for LLM interactions
- Blockchain utilities (mock for development)

---

## Version Numbering

- **Major (X.0.0)**: Breaking changes, major feature releases, production deployments
- **Minor (0.X.0)**: New features, enhancements, non-breaking changes
- **Patch (0.0.X)**: Bug fixes, small improvements, documentation updates

---

## Notes

### Known Limitations
- **In-Memory Storage**: Token balances and predictions reset on server restart
- **Mock Blockchain**: Using simulated contracts, not real Base network
- **Prediction Stakes**: Currently 0 tokens staked due to fresh wallet balances
- **Milestone Follow-Up**: Requires recent consultations (predictions lost after restart)

### Upcoming
- Railway production deployment
- Base Sepolia testnet integration
- Real blockchain wallets and token contracts
- Persistent prediction storage
- Advanced MindMender routing (Option 2)

---

[Unreleased]: https://github.com/kpjmd/orthoiq-agents/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/kpjmd/orthoiq-agents/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/kpjmd/orthoiq-agents/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/kpjmd/orthoiq-agents/releases/tag/v0.1.0
