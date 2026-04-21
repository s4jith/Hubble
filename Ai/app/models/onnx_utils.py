# app/models/onnx_utils.py
# ONNX export and inference utilities

from pathlib import Path
import numpy as np
from app.observability.logging import get_logger

logger = get_logger(__name__)


def export_to_onnx(
    model,
    sample_input: dict,
    output_path: Path,
    input_names: list[str] | None = None,
    output_names: list[str] | None = None,
    dynamic_axes: dict | None = None,
    opset_version: int = 14,
) -> Path:
    """
    Export a PyTorch model to ONNX format.

    Args:
        model: PyTorch model (eval mode).
        sample_input: Dict of tensor inputs for tracing.
        output_path: Where to save the .onnx file.
        input_names: Names for input tensors.
        output_names: Names for output tensors.
        dynamic_axes: Dynamic axes specification.
        opset_version: ONNX opset version.

    Returns:
        Path to the exported ONNX model.
    """
    import torch

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if input_names is None:
        input_names = list(sample_input.keys())
    if output_names is None:
        output_names = ["logits"]
    if dynamic_axes is None:
        dynamic_axes = {name: {0: "batch_size"} for name in input_names + output_names}

    # Prepare ordered tuple of inputs
    input_tuple = tuple(sample_input[name] for name in input_names)

    model.eval()
    with torch.no_grad():
        torch.onnx.export(
            model,
            input_tuple,
            str(output_path),
            input_names=input_names,
            output_names=output_names,
            dynamic_axes=dynamic_axes,
            opset_version=opset_version,
            do_constant_folding=True,
        )

    logger.info("onnx_export_complete", path=str(output_path), size_mb=round(output_path.stat().st_size / 1e6, 1))
    return output_path


def load_onnx_session(model_path: Path, providers: list[str] | None = None):
    """
    Load an ONNX model as an InferenceSession.

    Args:
        model_path: Path to .onnx file.
        providers: ONNX Runtime execution providers (defaults to CPU).

    Returns:
        ort.InferenceSession instance.
    """
    import onnxruntime as ort

    if providers is None:
        available = ort.get_available_providers()
        # Prefer CUDA if available, else CPU
        if "CUDAExecutionProvider" in available:
            providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
        else:
            providers = ["CPUExecutionProvider"]

    session = ort.InferenceSession(str(model_path), providers=providers)
    logger.info(
        "onnx_session_loaded",
        path=str(model_path),
        providers=providers,
    )
    return session


def onnx_inference(session, inputs: dict[str, np.ndarray]) -> list[np.ndarray]:
    """
    Run inference on an ONNX session.

    Args:
        session: ONNX InferenceSession.
        inputs: Dict mapping input names to numpy arrays.

    Returns:
        List of output numpy arrays.
    """
    # Ensure proper dtypes
    feed = {}
    for inp in session.get_inputs():
        if inp.name in inputs:
            arr = inputs[inp.name]
            # Match expected dtype
            if "int" in inp.type:
                arr = arr.astype(np.int64)
            else:
                arr = arr.astype(np.float32)
            feed[inp.name] = arr

    return session.run(None, feed)
