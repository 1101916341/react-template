#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
格式化 data.json 文件 - 简化数据结构，移除冗余嵌套

原始结构:
  bodyList[].rankMiss[].codeMissCount  -> 展平为 bodyList[].miss
  titleList[].xxxMissingValues         -> 简化为简短的字段名

用法:
  python format_json.py                         # 格式化 data.json 并覆盖原文件
  python format_json.py --preview               # 仅预览优化结果，不写入文件
  python format_json.py --output out.json       # 输出到指定文件
  python format_json.py --input new_data.json   # 处理其他文件（默认输入为 data.json）
  # 组合使用：
  python format_json.py --input raw.json --output formatted.json  # 读取 raw.json 输出到 formatted.json
  python format_json.py --input raw.json --preview                # 预览 raw.json 的优化效果
"""

import json
import os
import sys

# 当前脚本所在目录
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_INPUT = os.path.join(SCRIPT_DIR, 'data.json')
DEFAULT_OUTPUT = os.path.join(SCRIPT_DIR, 'data.json')


def load_json(filepath: str) -> dict:
    """加载 JSON 文件"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(data: dict, filepath: str, indent: int = 2) -> None:
    """保存 JSON 文件"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=indent)
    print(f'[OK] 文件已保存: {filepath}')


def optimize_body_list(body_list: list) -> list:
    """
    优化 bodyList:
      - codeMissCount 从 rankMiss[0] 提升到顶层，字段名简化为 miss
      - 移除 rankMiss 嵌套层级
      - 保留原始顺序: issue, code, miss
    """
    optimized = []
    for item in body_list:
        rank_miss = item.get('rankMiss', [])
        first_rank = rank_miss[0] if rank_miss else {}
        optimized.append({
            'issue': item.get('preDrawIssue', ''),
            'code': item.get('preDrawCode', []),
            'miss': first_rank.get('codeMissCount', [])
        })
    return optimized


def optimize_title_list(title_list: list) -> list:
    """
    优化 titleList:
      - maxMissingValues  -> maxMiss
      - averageMissingValues -> avgMiss
      - currentMissingValues -> curMiss
      - appearCount       -> appear
      - maxAppearValues   -> maxAppear
    """
    field_map = {
        'maxMissingValues': 'maxMiss',
        'averageMissingValues': 'avgMiss',
        'currentMissingValues': 'curMiss',
        'appearCount': 'appear',
        'maxAppearValues': 'maxAppear',
    }
    optimized = []
    for item in title_list:
        new_item = {'rank': item.get('rank', 0)}
        for old_key, new_key in field_map.items():
            if old_key in item:
                new_item[new_key] = item[old_key]
        optimized.append(new_item)
    return optimized


def optimize(data: dict) -> dict:
    """优化整个 JSON 数据结构"""
    inner = data.get('data', {})
    return {
        'code': data.get('code', ''),
        'msg': data.get('msg'),
        'gameID': data.get('gameID', ''),
        'gameType': data.get('gameType', ''),
        'zoushiCode': data.get('zoushiCode', ''),
        'data': {
            'bodyList': optimize_body_list(inner.get('bodyList', [])),
            'titleList': optimize_title_list(inner.get('titleList', [])),
        }
    }


def print_preview(original: dict, optimized: dict) -> None:
    """打印优化前后的对比信息"""
    orig_size = len(json.dumps(original, ensure_ascii=False))
    opt_size = len(json.dumps(optimized, ensure_ascii=False))
    ratio = (1 - opt_size / orig_size) * 100 if orig_size else 0

    print('=' * 50)
    print('优化前后对比')
    print('=' * 50)
    print(f'原始数据大小: {orig_size:,} bytes')
    print(f'优化后大小:   {opt_size:,} bytes')
    print(f'缩减比例:     {ratio:.1f}%')
    print()

    orig_body = original.get('data', {}).get('bodyList', [])
    opt_body = optimized.get('data', {}).get('bodyList', [])
    print(f'原始 bodyList 数量: {len(orig_body)}')
    print(f'优化 bodyList 数量: {len(opt_body)}')
    print()
    if opt_body:
        first = opt_body[0]
        print(f'bodyList[0] 示例:')
        print(f'  issue: {first["issue"]}')
        print(f'  code:  {first["code"]}')
        print(f'  miss:  [{len(first["miss"])} 个数值]')
    print()
    opt_titles = optimized.get('data', {}).get('titleList', [])
    print(f'titleList 数量: {len(opt_titles)}')
    if opt_titles:
        print(f'titleList[0] 示例:')
        print(f'  {opt_titles[0]}')


def main():
    args = sys.argv[1:]
    preview_mode = '--preview' in args
    input_file = DEFAULT_INPUT
    custom_output = None

    for i, arg in enumerate(args):
        if arg == '--input' and i + 1 < len(args):
            input_file = args[i + 1]
        if arg == '--output' and i + 1 < len(args):
            custom_output = args[i + 1]
    output_file = custom_output or DEFAULT_OUTPUT

    if not os.path.exists(input_file):
        print(f'[ERROR] 输入文件不存在: {input_file}')
        sys.exit(1)

    data = load_json(input_file)
    optimized = optimize(data)

    if preview_mode:
        print_preview(data, optimized)
    else:
        save_json(optimized, output_file)
        print_preview(data, optimized)


if __name__ == '__main__':
    main()
