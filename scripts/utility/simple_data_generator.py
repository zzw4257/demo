#!/usr/bin/env python3
"""
简化版DeSci数据生成器
"""

import json
import hashlib
import random
from datetime import datetime
import numpy as np

def generate_climate_data():
    """生成气候数据"""
    data = []
    for i in range(100):
        record = {
            'date': f'2024-{i%12+1:02d}-{i%28+1:02d}',
            'temperature': round(15 + random.uniform(-5, 5), 2),
            'co2_level': round(400 + random.uniform(-20, 20), 2),
            'latitude': round(random.uniform(-90, 90), 4),
            'longitude': round(random.uniform(-180, 180), 4)
        }
        data.append(record)
    return data

def generate_drug_data():
    """生成药物数据"""
    compounds = ['C1CCCCC1', 'CC(=O)OC1=CC=CC=C1C(=O)O', 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C']
    data = []
    for i in range(50):
        record = {
            'compound_id': f'DS_{i:04d}',
            'smiles': random.choice(compounds),
            'molecular_weight': round(random.uniform(100, 800), 2),
            'toxicity_score': round(random.uniform(0, 1), 3),
            'target_protein': random.choice(['EGFR', 'BRAF', 'TP53']),
            'disease_target': random.choice(['Cancer', 'Diabetes', 'Alzheimer'])
        }
        data.append(record)
    return data

def main():
    print("🚀 生成示例数据...")

    # 生成气候数据
    climate_data = generate_climate_data()
    print(f"✅ 生成气候数据: {len(climate_data)} 条记录")

    # 生成药物数据
    drug_data = generate_drug_data()
    print(f"✅ 生成药物数据: {len(drug_data)} 条记录")

    # 创建研究项目
    research_project = {
        'title': '区块链驱动的气候变化与药物研发研究',
        'description': '利用区块链技术确保科学研究数据的完整性和可追溯性',
        'climate_data': climate_data,
        'drug_data': drug_data,
        'metadata': {
            'researcher': 'Dr. Blockchain Scientist',
            'institution': 'Decentralized Research Lab',
            'timestamp': datetime.now().isoformat(),
            'blockchain_benefits': [
                '数据不可篡改',
                '透明可追溯',
                '去中心化协作',
                '激励机制完善'
            ]
        }
    }

    # 保存到文件
    with open('sample_research_data.json', 'w', encoding='utf-8') as f:
        json.dump(research_project, f, indent=2, ensure_ascii=False)

    print("✅ 数据已保存到 sample_research_data.json")

    # 显示数据示例
    print("\n📊 数据预览:")
    print("气候数据示例:", climate_data[0])
    print("药物数据示例:", drug_data[0])

if __name__ == "__main__":
    main()
