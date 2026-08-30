import torch
import sys

path = r'e:\codingfolder\DermSight\Dermsight\assets\models\best_cbm_full.pth'
state = torch.load(path, map_location='cpu', weights_only=True)
print('type:', type(state))
if isinstance(state, dict):
    for k, v in state.items():
        if hasattr(v, 'shape'):
            print(k, tuple(v.shape))
        else:
            print(k, type(v), v)
else:
    print(state)
