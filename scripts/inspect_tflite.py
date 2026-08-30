import sys
sys.path.append(r'C:\Users\Laptop\AppData\Local\Programs\Python\Python312\Lib\site-packages')

try:
    import ai_edge_litert.interpreter as litert
    interp = litert.Interpreter(model_path=r'e:\codingfolder\DermSight\Dermsight\assets\models\model.tflite')
except Exception as e:
    print('litert error', e)
    import tflite_runtime.interpreter as tflite
    interp = tflite.Interpreter(model_path=r'e:\codingfolder\DermSight\Dermsight\assets\models\model.tflite')

interp.allocate_tensors()
for detail in interp.get_input_details():
    print('input', detail['name'], detail['shape'].tolist(), detail['dtype'])
for detail in interp.get_output_details():
    print('output', detail['name'], detail['shape'].tolist(), detail['dtype'])
