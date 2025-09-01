#!/usr/bin/env python3
"""
DeSci Data Generator - 去中心化科学研究数据生成器

这个脚本用于生成真实的科学数据集和研究结果，用于演示区块链在科学研究中的应用。

主要功能：
1. 生成气候变化数据集
2. 生成药物研发数据
3. 生成AI模型训练数据
4. 生成生物信息学数据集
5. 实现数据签名和验证
"""

import json
import hashlib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
from typing import Dict, List, Any
import secrets
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization
import base64


class DeSciDataGenerator:
    """
    去中心化科学研究数据生成器

    故事背景：
    在未来，科学研究已经不再局限于传统实验室。
    科学家们使用区块链技术来确保研究数据的真实性和可追溯性。
    通过智能合约和零知识证明，研究结果可以被安全地验证和共享。

    为什么使用Web3和以太坊？
    1. 去中心化：避免数据垄断和审查
    2. 透明性：所有研究过程可追溯
    3. 激励机制：通过代币奖励优质研究
    4. 数据完整性：通过密码学保证数据不被篡改
    5. 协作性：全球科学家可以安全地协作
    """

    def __init__(self):
        self.research_domains = [
            "climate_science",
            "drug_discovery",
            "ai_models",
            "genomics",
            "neuroscience",
            "materials_science"
        ]

        # 生成RSA密钥对用于数据签名
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        self.public_key = self.private_key.public_key()

    def generate_climate_dataset(self, num_records: int = 1000) -> Dict[str, Any]:
        """生成气候变化研究数据集"""
        print("🌍 生成气候变化数据集...")

        # 生成全球温度数据
        dates = pd.date_range('2000-01-01', periods=num_records, freq='D')

        data = {
            'date': dates.strftime('%Y-%m-%d').tolist(),
            'global_temperature': np.random.normal(15.0, 2.0, num_records).round(2).tolist(),
            'co2_level': np.random.normal(400.0, 20.0, num_records).round(2).tolist(),
            'sea_level': np.random.normal(0.0, 0.1, num_records).round(3).tolist(),
            'arctic_ice_extent': np.random.normal(12.0, 1.5, num_records).round(2).tolist(),
            'latitude': np.random.uniform(-90, 90, num_records).round(4).tolist(),
            'longitude': np.random.uniform(-180, 180, num_records).round(4).tolist(),
            'measurement_station': [f"Station_{i:03d}" for i in range(num_records)]
        }

        # 添加趋势：温度随时间增加
        for i in range(len(data['date'])):
            year_progress = i / len(data['date'])
            data['global_temperature'][i] += year_progress * 2.0  # 20年内升温2度

        return {
            'domain': 'climate_science',
            'title': 'Global Climate Change Monitoring Dataset 2000-2024',
            'description': 'Comprehensive dataset tracking global climate indicators including temperature, CO2 levels, sea level rise, and Arctic ice extent. Data collected from distributed sensor networks worldwide.',
            'data': data,
            'metadata': {
                'total_records': num_records,
                'collection_period': '2000-01-01 to 2024-01-01',
                'data_source': 'Global Sensor Network',
                'license': 'CC-BY-4.0',
                'ethics_approval': 'Approved by International Climate Research Council',
                'data_quality_score': 0.95
            }
        }

    def generate_drug_discovery_dataset(self, num_compounds: int = 500) -> Dict[str, Any]:
        """生成药物研发数据集"""
        print("💊 生成药物研发数据集...")

        # 生成分子数据
        compounds = []
        for i in range(num_compounds):
            compound = {
                'compound_id': f"DS_{i:04d}",
                'smiles': self._generate_random_smiles(),
                'molecular_weight': np.random.uniform(100, 800).round(2),
                'logp': np.random.uniform(-2, 6).round(2),
                'solubility': np.random.uniform(0.001, 100).round(3),
                'toxicity_score': np.random.uniform(0, 1).round(3),
                'binding_affinity': np.random.uniform(-10, -5).round(2),
                'synthesis_complexity': random.randint(1, 10),
                'target_protein': random.choice([
                    'EGFR', 'BRAF', 'CDK4', 'mTOR', 'PI3K', 'MEK1',
                    'ALK', 'ROS1', 'RET', 'MET', 'HER2', 'BRCA1'
                ]),
                'disease_target': random.choice([
                    'Non-small cell lung cancer',
                    'Melanoma',
                    'Breast cancer',
                    'Colorectal cancer',
                    'Glioblastoma',
                    'Acute myeloid leukemia'
                ])
            }
            compounds.append(compound)

        return {
            'domain': 'drug_discovery',
            'title': 'Novel Small Molecule Library for Cancer Therapy',
            'description': 'High-throughput screening results for 500+ novel small molecules targeting key oncogenic pathways. Includes molecular properties, toxicity profiles, and preliminary binding data.',
            'data': compounds,
            'metadata': {
                'total_compounds': num_compounds,
                'screening_method': 'High-throughput biochemical assays',
                'validation_status': 'Preclinical validation completed',
                'patent_status': 'Patent pending',
                'funding_source': 'National Cancer Research Foundation',
                'publication_ready': True,
                'data_confidentiality': 'Restricted to verified researchers'
            }
        }

    def generate_ai_model_dataset(self, num_samples: int = 10000) -> Dict[str, Any]:
        """生成AI模型训练数据集"""
        print("🤖 生成AI模型训练数据集...")

        # 生成医疗影像分类数据
        categories = [
            'Normal', 'Benign', 'Malignant', 'Suspicious',
            'Inflammatory', 'Vascular', 'Cystic', 'Solid'
        ]

        data = []
        for i in range(num_samples):
            sample = {
                'image_id': f"IMG_{i:06d}",
                'patient_id': f"PAT_{random.randint(1000, 9999)}",
                'diagnosis': random.choice(categories),
                'confidence_score': np.random.uniform(0.3, 1.0).round(3),
                'radiologist_agreement': np.random.uniform(0.6, 1.0).round(3),
                'ai_prediction': random.choice(categories),
                'prediction_confidence': np.random.uniform(0.4, 1.0).round(3),
                'modality': random.choice(['CT', 'MRI', 'X-ray', 'Ultrasound']),
                'body_region': random.choice([
                    'Head', 'Chest', 'Abdomen', 'Pelvis',
                    'Extremities', 'Spine', 'Cardiac'
                ]),
                'age': random.randint(18, 90),
                'sex': random.choice(['M', 'F']),
                'ethnicity': random.choice([
                    'Caucasian', 'African', 'Asian', 'Hispanic', 'Other'
                ])
            }
            data.append(sample)

        return {
            'domain': 'ai_models',
            'title': 'Medical Image Classification Dataset for AI Training',
            'description': 'Large-scale dataset of medical images with expert annotations for training AI models in medical image classification. Includes multi-modal imaging data and demographic information.',
            'data': data,
            'metadata': {
                'total_samples': num_samples,
                'modalities': ['CT', 'MRI', 'X-ray', 'Ultrasound'],
                'classes': categories,
                'annotation_quality': 'Double-blinded expert consensus',
                'privacy_protection': 'All patient identifiers removed',
                'intended_use': 'AI model training and validation',
                'model_performance_baseline': 0.87,
                'ethical_clearance': 'Approved by Institutional Review Board'
            }
        }

    def generate_genomics_dataset(self, num_sequences: int = 200) -> Dict[str, Any]:
        """生成基因组学数据集"""
        print("🧬 生成基因组学数据集...")

        genes = ['BRCA1', 'TP53', 'EGFR', 'KRAS', 'PIK3CA', 'PTEN', 'APC', 'MLH1', 'MSH2', 'CDKN2A']
        variants = ['Missense', 'Nonsense', 'Frameshift', 'Splice site', 'Deletion', 'Insertion', 'Duplication']

        data = []
        for i in range(num_sequences):
            sequence = {
                'sequence_id': f"SEQ_{i:05d}",
                'gene': random.choice(genes),
                'variant_type': random.choice(variants),
                'chromosome': random.randint(1, 22),
                'position': random.randint(1000000, 200000000),
                'reference_allele': random.choice(['A', 'T', 'C', 'G']),
                'alternate_allele': random.choice(['A', 'T', 'C', 'G']),
                'variant_frequency': np.random.uniform(0.001, 0.5).round(4),
                'read_depth': random.randint(10, 1000),
                'quality_score': np.random.uniform(20, 60).round(1),
                'clinical_significance': random.choice([
                    'Pathogenic', 'Likely pathogenic', 'Uncertain significance',
                    'Likely benign', 'Benign', 'Not classified'
                ]),
                'disease_association': random.choice([
                    'Breast cancer', 'Colorectal cancer', 'Lung cancer',
                    'Pancreatic cancer', 'Ovarian cancer', 'Endometrial cancer',
                    'Prostate cancer', 'Melanoma', 'Glioblastoma'
                ]),
                'population_frequency': np.random.uniform(0.0001, 0.01).round(6)
            }
            data.append(sequence)

        return {
            'domain': 'genomics',
            'title': 'Comprehensive Cancer Genome Variant Database',
            'description': 'Large-scale genomic variant analysis from cancer patients, including germline and somatic mutations across multiple cancer types. Data includes variant annotations, clinical correlations, and population frequencies.',
            'data': data,
            'metadata': {
                'total_variants': num_sequences,
                'sequencing_platform': 'Illumina NovaSeq 6000',
                'coverage_depth': '100x average',
                'variant_calling_pipeline': 'GATK Best Practices',
                'annotation_sources': ['ClinVar', 'COSMIC', 'dbSNP'],
                'ethical_approval': 'Approved by National Genomics Ethics Committee',
                'data_sharing_policy': 'Controlled access with researcher verification',
                'publication_count': 15,
                'citation_impact': 245
            }
        }

    def _generate_random_smiles(self) -> str:
        """生成随机的SMILES字符串（简化版）"""
        atoms = ['C', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I']
        bonds = ['', '=', '#']

        smiles_parts = []
        for _ in range(random.randint(5, 15)):
            atom = random.choice(atoms)
            if random.random() < 0.3:
                # 添加支链
                smiles_parts.append(f"({atom})")
            else:
                smiles_parts.append(atom)

            # 添加键
            if random.random() < 0.2:
                smiles_parts.append(random.choice(bonds))

        return ''.join(smiles_parts)

    def sign_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """使用私钥对数据进行签名"""
        # 将数据转换为JSON字符串
        data_str = json.dumps(data, sort_keys=True)

        # 计算数据的哈希值
        data_hash = hashlib.sha256(data_str.encode()).digest()

        # 使用私钥签名
        signature = self.private_key.sign(
            data_hash,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )

        # 转换为base64编码
        signature_b64 = base64.b64encode(signature).decode()

        return {
            'data': data,
            'signature': signature_b64,
            'public_key': self.public_key.public_key_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ).decode(),
            'timestamp': datetime.now().isoformat(),
            'data_hash': hashlib.sha256(data_str.encode()).hexdigest()
        }

    def verify_signature(self, signed_data: Dict[str, Any]) -> bool:
        """验证数据签名"""
        try:
            data = signed_data['data']
            signature_b64 = signed_data['signature']
            public_key_pem = signed_data['public_key']

            # 重新构建数据字符串
            data_str = json.dumps(data, sort_keys=True)
            data_hash = hashlib.sha256(data_str.encode()).digest()

            # 解码签名
            signature = base64.b64decode(signature_b64)

            # 加载公钥
            public_key = serialization.load_pem_public_key(public_key_pem.encode())

            # 验证签名
            public_key.verify(
                signature,
                data_hash,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )

            return True

        except Exception as e:
            print(f"签名验证失败: {e}")
            return False

    def generate_research_story(self) -> Dict[str, Any]:
        """生成一个完整的研究故事"""
        print("📖 生成研究故事...")

        # 选择研究领域
        domain = random.choice(self.research_domains)

        # 根据领域生成相应数据集
        if domain == 'climate_science':
            dataset = self.generate_climate_dataset(500)
        elif domain == 'drug_discovery':
            dataset = self.generate_drug_discovery_dataset(200)
        elif domain == 'ai_models':
            dataset = self.generate_ai_model_dataset(1000)
        else:
            dataset = self.generate_genomics_dataset(100)

        # 创建研究元数据
        research_metadata = {
            'researcher': {
                'name': 'Dr. Sarah Chen',
                'institution': 'International Research Consortium',
                'credentials': 'PhD in Computational Biology, 15+ years experience',
                'orcid_id': '0000-0002-1234-5678',
                'reputation_score': 95,
                'publications': 47,
                'citations': 1250
            },
            'funding': {
                'grant_id': 'NSF-2024-001',
                'amount': '2.5M USD',
                'duration': '3 years',
                'funder': 'National Science Foundation',
                'collaborators': [
                    'Stanford University',
                    'MIT',
                    'ETH Zurich',
                    'Tsinghua University'
                ]
            },
            'methodology': {
                'approach': 'Blockchain-enabled reproducible research',
                'data_collection': 'Distributed sensor networks',
                'analysis_methods': ['Machine Learning', 'Statistical Modeling', 'Blockchain Verification'],
                'reproducibility_score': 0.92,
                'open_science_practices': True
            },
            'impact': {
                'citations': 0,
                'downloads': 0,
                'peer_reviews': 0,
                'media_coverage': 0,
                'policy_influence': 'Moderate',
                'societal_benefit': 'High - addresses climate crisis'
            },
            'blockchain_benefits': [
                'Immutable data provenance',
                'Transparent peer review process',
                'Automated royalty distribution',
                'Global collaboration without borders',
                'Tamper-proof research records',
                'Decentralized funding mechanisms'
            ]
        }

        # 合并数据集和研究元数据
        complete_research = {
            **dataset,
            'research_metadata': research_metadata,
            'blockchain_integration': {
                'contract_address': '0x1234567890abcdef...',
                'nft_token_id': random.randint(1000, 9999),
                'zk_proof_ids': [random.randint(10000, 99999) for _ in range(3)],
                'data_hash': hashlib.sha256(json.dumps(dataset['data'], sort_keys=True).encode()).hexdigest(),
                'timestamp': datetime.now().isoformat(),
                'network': 'Ethereum Mainnet'
            }
        }

        return self.sign_data(complete_research)

    def generate_multiple_researches(self, count: int = 5) -> List[Dict[str, Any]]:
        """生成多个研究项目"""
        researches = []
        for i in range(count):
            print(f"生成研究项目 {i+1}/{count}...")
            research = self.generate_research_story()
            researches.append(research)

        return researches

    def export_to_json(self, data: Dict[str, Any], filename: str):
        """导出数据到JSON文件"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ 数据已导出到 {filename}")

    def export_to_blockchain_format(self, researches: List[Dict[str, Any]], filename: str):
        """导出为区块链可用的格式"""
        blockchain_data = {
            'researches': researches,
            'platform_metadata': {
                'name': 'DeSci Platform',
                'version': '1.0.0',
                'network': 'Ethereum',
                'contract_addresses': {
                    'platform': '0x1234567890abcdef...',
                    'user_profile': '0x234567890abcdef...',
                    'zk_proof': '0x34567890abcdef...',
                    'nft': '0x4567890abcdef...',
                    'dataset': '0x567890abcdef...'
                },
                'total_researches': len(researches),
                'total_researchers': len(set(r['data']['research_metadata']['researcher']['orcid_id'] for r in researches)),
                'data_integrity_verified': True,
                'timestamp': datetime.now().isoformat()
            }
        }

        self.export_to_json(blockchain_data, filename)


def main():
    """主函数"""
    print("🚀 DeSci Data Generator - 去中心化科学研究数据生成器")
    print("=" * 60)

    generator = DeSciDataGenerator()

    # 生成多个研究项目
    print("生成示例研究数据集...")
    researches = generator.generate_multiple_researches(5)

    # 导出数据
    generator.export_to_blockchain_format(researches, 'sample_research_data.json')

    # 验证签名
    print("验证数据签名...")
    for i, research in enumerate(researches):
        is_valid = generator.verify_signature(research)
        print(f"研究项目 {i+1} 签名验证: {'✅ 通过' if is_valid else '❌ 失败'}")

    print("\n" + "=" * 60)
    print("🎉 数据生成完成！")
    print("\n为什么选择Web3和以太坊？")
    print("1. 🔒 不可篡改性 - 数据一旦上链，永久保存且无法修改")
    print("2. 🌐 去中心化 - 无单点故障，无需信任中心化机构")
    print("3. 💰 激励机制 - 通过代币奖励优质研究和同行评审")
    print("4. 🔍 透明性 - 所有研究过程可追溯，公开可验证")
    print("5. 🤝 协作性 - 全球科学家可以安全高效地协作")
    print("6. 📊 数据完整性 - 通过密码学保证数据真实性")
    print("\n生成的示例数据已保存到 sample_research_data.json")


if __name__ == "__main__":
    main()
