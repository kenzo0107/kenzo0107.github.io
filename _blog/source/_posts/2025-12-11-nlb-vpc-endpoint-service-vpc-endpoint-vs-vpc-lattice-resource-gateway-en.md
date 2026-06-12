---
title: 'Comparing AWS VPC Lattice Resource Gateway with the NLB + VPC Endpoint Architecture'
date: 2025-12-11
lang: en
translation_id: nlb-vpc-endpoint-service-vpc-endpoint-vs-vpc-lattice-resource-gateway
permalink: en/2025/12/11/nlb-vpc-endpoint-service-vpc-endpoint-vs-vpc-lattice-resource-gateway/
category: AWS
cover: https://i.imgur.com/qSyZbW0.png
---

## Overview

In this article, I provide a detailed comparison of AWS VPC Lattice's Resource Gateway and the traditional Network Load Balancer (NLB) + VPC Endpoint Service + VPC Endpoint architecture, looking at cost, security, and performance.

These are the results of research conducted using the [AWS Documentation MCP](https://awslabs.github.io/mcp/servers/aws-documentation-mcp-server).

<!--more-->

## Architectures Being Compared

### Architecture 1: NLB + VPC Endpoint Service + VPC Endpoint
- Network Load Balancer
- VPC Endpoint Service
- VPC Endpoint

### Architecture 2: VPC Lattice Resource Gateway
- VPC Lattice Service
- Resource Gateway
- Resource Configuration

## Cost Comparison

This comparison is based on pricing research conducted using the AWS Pricing API as of December 2025.

### NLB + VPC Endpoint Service + VPC Endpoint

| Component | Hourly rate | Monthly base cost |
|----------------|----------|--------------|
| Network Load Balancer | $0.0225/hour | $16.20 |
| NLB LCU usage | $0.006/LCU-hour | Usage-based |
| VPC Endpoint Service | $0.05/hour (per remote region) | $36.00 |
| VPC Endpoint | $0.01/hour | $7.20 |
| Data processing fee | $0.01/GB (up to 1PB) | Usage-based |

**Total monthly base cost**: approximately **$59.40** + usage-based charges

### VPC Lattice Resource Gateway

| Component | Hourly rate | Monthly base cost |
|----------------|----------|--------------|
| VPC Lattice Service | $0.025/hour | $18.00 |
| Resource Gateway | $0.02/hour (per resource) | $14.40 |
| Data processing fee | $0.025/GB | Usage-based |
| Connections/requests | $0.0000001/hour | Negligible |

**Total monthly base cost**: approximately **$32.40** + data processing fees

### Cost Analysis Results

- VPC Lattice's base cost is about **45% cheaper**
- The data processing fee is 2.5x higher for VPC Lattice
- For low to moderate data transfer volumes, VPC Lattice is more advantageous

## Security Comparison

| Security item | NLB+VPC Endpoint | VPC Lattice Resource Gateway |
|------------------|------------------|------------------------------|
| **Network isolation** | ✅ Fully private communication | ✅ Fully private communication |
| **IAM integration** | ⚠️ Limited support | ✅ Fine-grained access control possible |
| **Authentication/authorization** | ❌ Basic at the NLB level | ✅ Supports service and resource levels |
| **Network ACLs** | ✅ VPC/subnet level | ✅ Service Network level |
| **Security groups** | ✅ Standard support | ✅ Standard support |
| **Audit logs** | ⚠️ CloudTrail, VPC Flow Logs | ✅ CloudTrail + VPC Lattice-specific logs |
| **Encryption** | ✅ TLS termination supported | ✅ TLS termination supported |

### Security Analysis Results

VPC Lattice has the advantage on security thanks to **fine-grained access control through IAM integration** and **unified audit logs**.

## Performance Comparison

| Performance item | NLB+VPC Endpoint | VPC Lattice Resource Gateway |
|--------------------|------------------|------------------------------|
| **Latency** | ⚠️ Multiple hops (NLB→Target) | ✅ Low latency via direct routing |
| **Throughput** | ✅ High (NLB's proven performance) | ✅ High (purpose-built design) |
| **Availability** | ✅ Multi-AZ NLB + Endpoint | ✅ Automatic redundancy of the Service Network |
| **Scalability** | ✅ NLB auto-scaling | ✅ Auto-scaling supported |
| **Health checks** | ✅ NLB target health checks | ✅ Resource Configuration health checks |
| **Load balancing** | ✅ Supports multiple algorithms | ⚠️ Basic load balancing |

### Performance Analysis Results

- **Latency**: VPC Lattice has the advantage
- **Flexibility**: NLB has the advantage with diverse load balancing options
- **Overall**: The advantage depends on the use case

## Operations and Management Comparison

| Operations/management item | NLB+VPC Endpoint | VPC Lattice Resource Gateway |
|--------------|------------------|------------------------------|
| **Configuration complexity** | ❌ Complex (managing multiple components) | ✅ Simple (unified management) |
| **Monitoring/metrics** | ⚠️ Individual monitoring of multiple services | ✅ Unified metrics |
| **Troubleshooting** | ❌ Requires investigating multiple points | ✅ Centralized logs and metrics |
| **Multi-region support** | ❌ Individual configuration per region | ✅ Unified management via the Service Network |
| **Learning curve** | ✅ Combination of existing technologies | ⚠️ Requires understanding a new service |

## Overall Comparison and Pros/Cons

### NLB + VPC Endpoint Service + VPC Endpoint

#### Pros
- ✅ **Mature technology**: A long track record of operation and stability
- ✅ **Affinity with existing infrastructure**: Integrates naturally with existing VPC-based configurations
- ✅ **Rich load balancing features**: Multiple algorithms and health check options
- ✅ **Detailed network control**: Fine-grained control via security groups and NACLs
- ✅ **Abundant documentation**: Many examples and solutions exist

#### Cons
- 🤔 **High initial cost**: A base cost of about $59.40 per month
- 🤔 **Complex configuration/management**: Requires individual management of multiple components
- 🤔 **Operational burden**: Monitoring and troubleshooting across multiple services
- 🤔 **Latency**: Slight delay due to multiple hops

### VPC Lattice Resource Gateway

#### Pros
- ✅ **Low initial cost**: A base cost of about $32.40 per month (45% cheaper)
- ✅ **Simple management**: Centralized management through an integrated service
- ✅ **Excellent IAM integration**: Fine-grained access control at the service and resource levels
- ✅ **Unified monitoring**: Centralized metrics and logs
- ✅ **Low latency**: Fast communication via direct routing
- ✅ **Multi-region support**: Unified management via the Service Network

#### Cons
- 🤔 **Data processing fees**: Usage-based charges during high traffic ($0.025/GB)
- 🤔 **Feature constraints**: Lacks load balancing options as flexible as NLB's

## Recommended Scenarios

### When to Recommend VPC Lattice Resource Gateway

🎯 **Best suited when the following conditions apply**:
- Building a new system
- Prioritizing simple management and operations
- Fine-grained access control via IAM is important
- Data transfer volume is moderate or lower (on the order of a few TB per month)
- Prioritizing operational cost
- Planning a multi-region deployment

### When to Recommend NLB + VPC Endpoint

🎯 **Best suited when the following conditions apply**:
- Prioritizing consistency with existing VPC infrastructure
- Advanced load balancing features are required
- Operational track record and stability are the top priority
- Very high data transfer volume (tens of TB or more per month)
- Wanting to leverage the existing team's NLB operational skills

## Considerations for Implementation

### Migration Strategy
- **Phased migration**: Migrate to VPC Lattice in stages, starting with less critical services
- **Hybrid operation**: Use both approaches selectively depending on requirements
- **Cost monitoring**: Periodically review costs based on measured data transfer volumes

### Technical Considerations
- **Monitoring design**: A monitoring design that accommodates VPC Lattice's new metrics
- **Security policies**: An access control design based on IAM policies
- **Disaster recovery**: A redundancy design for the Service Network

## Conclusion

AWS VPC Lattice Resource Gateway is a new solution that holds advantages in **cost efficiency, operability, and security features** compared to the traditional NLB + VPC Endpoint architecture.

In particular, when **building a new system** or prioritizing **simple operations**, I strongly recommend adopting VPC Lattice. On the other hand, when prioritizing **consistency with existing infrastructure** or an **operational track record**, the traditional NLB + VPC Endpoint architecture remains a valid choice.

The final decision should be made by comprehensively evaluating the system's requirements, constraints, and the team's skill level.

## References

### AWS Official Documentation
- [Amazon VPC Lattice User Guide](https://docs.aws.amazon.com/vpc-lattice/latest/ug/what-is-vpc-lattice.html)
- [Elastic Load Balancing - Network Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/)
- [VPC Endpoints - AWS PrivateLink](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
- [AWS Pricing - VPC Lattice](https://aws.amazon.com/vpc-lattice/pricing/)
- [AWS Pricing - Elastic Load Balancing](https://aws.amazon.com/elasticloadbalancing/pricing/)

### AWS Blogs and Technical Articles
- [Introducing Amazon VPC Lattice – Simplify Networking for Service-to-Service Communication](https://aws.amazon.com/blogs/aws/introducing-amazon-vpc-lattice-simplify-networking-for-service-to-service-communication/)
- [Amazon VPC Lattice でマイクロサービス間の通信を簡単に](https://aws.amazon.com/jp/blogs/news/introducing-amazon-vpc-lattice/)

### Pricing Information Sources
- [AWS Price List API](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/price-list-api.html) - The source of the pricing data used in this analysis

---

*This analysis is based on AWS Pricing API data as of December 2025. Prices are subject to change, so please check the official documentation for the latest information.*

That's all.<br>
I hope you find it helpful.
