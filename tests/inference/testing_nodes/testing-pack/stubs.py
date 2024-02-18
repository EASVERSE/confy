import torch

class StubImage:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "content": (['WHITE', 'BLACK', 'NOISE'],),
                "height": ("INT", {"default": 512, "min": 1, "max": 1024 ** 3, "step": 1}),
                "width": ("INT", {"default": 512, "min": 1, "max": 4096 ** 3, "step": 1}),
                "batch_size": ("INT", {"default": 1, "min": 1, "max": 1024 ** 3, "step": 1}),
            },
        }

    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "stub_image"

    CATEGORY = "Testing/Stub Nodes"

    def stub_image(self, content, height, width, batch_size):
        if content == "WHITE":
            return (torch.ones(batch_size, height, width, 3),)
        elif content == "BLACK":
            return (torch.zeros(batch_size, height, width, 3),)
        elif content == "NOISE":
            return (torch.rand(batch_size, height, width, 3),)

class StubMask:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "value": ("FLOAT", {"default": 0.5, "min": 0.0, "max": 1.0, "step": 0.01}),
                "height": ("INT", {"default": 512, "min": 1, "max": 1024 ** 3, "step": 1}),
                "width": ("INT", {"default": 512, "min": 1, "max": 4096 ** 3, "step": 1}),
                "batch_size": ("INT", {"default": 1, "min": 1, "max": 1024 ** 3, "step": 1}),
            },
        }

    RETURN_TYPES = ("MASK",)
    FUNCTION = "stub_mask"

    CATEGORY = "Testing/Stub Nodes"

    def stub_mask(self, value, height, width, batch_size):
        return (torch.ones(batch_size, height, width) * value,)

TEST_STUB_NODE_CLASS_MAPPINGS = {
    "StubImage": StubImage,
    "StubMask": StubMask,
}
TEST_STUB_NODE_DISPLAY_NAME_MAPPINGS = {
    "StubImage": "Stub Image",
    "StubMask": "Stub Mask",
}
