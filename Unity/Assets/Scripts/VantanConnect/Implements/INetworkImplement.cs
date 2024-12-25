using Cysharp.Threading.Tasks;

public interface INetworkImplement
{
    UniTask<string> GetAddress();
}
