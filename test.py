import torch
import time

# Matrix size
N = 10000

# ================= CPU =================
print("Running on CPU...")
a_cpu = torch.randn(N, N)
b_cpu = torch.randn(N, N)

start = time.time()
c_cpu = torch.matmul(a_cpu, b_cpu)
end = time.time()

print(f"CPU Time: {end - start:.2f} seconds")

# ================= GPU =================
if torch.cuda.is_available():
    print("\nRunning on GPU...")
    
    device = torch.device("cuda")
    
    a_gpu = torch.randn(N, N, device=device)
    b_gpu = torch.randn(N, N, device=device)

    torch.cuda.synchronize()
    start = time.time()
    
    c_gpu = torch.matmul(a_gpu, b_gpu)
    
    torch.cuda.synchronize()
    end = time.time()

    print(f"GPU Time: {end - start:.2f} seconds")

else:
    print("GPU not available")