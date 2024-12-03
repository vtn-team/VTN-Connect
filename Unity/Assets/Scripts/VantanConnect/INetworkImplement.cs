using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

public interface INetworkImplement
{
    void Login(string uuid);
    void GetUser(string uuid);
    void CreateUser(string name);
}
