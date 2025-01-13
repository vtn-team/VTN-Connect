using UnityEngine;
using UnityEditor;
using System.IO;
using System.Text.RegularExpressions;
using System.Text;
using System;
using System.CodeDom.Compiler;

public class PackageExporter
{
    /// <summary>
    /// �p�b�P�[�W�Ώۂ̃t�H���_�A�t�@�C��
    /// </summary>
    static string[] PackTargets = new string[] {
        "Assets/ConnectEventAssets",
        "Assets/Scripts",
        "Assets/ThirdParty",
    };

    /// <summary>
    /// �o�[�W���j���O
    /// </summary>
    [MenuItem("VTNTools/Export/Versioning %e")]
    static void Versioning()
    {
        string PackageName = Application.productName;
        string Version = Application.version;

        //�r���h�����L�ڂ����t�@�C������������
        BuildStateBuild(PackageName, Version);
    }

    /// <summary>
    /// �����Ńp�b�P�[�W������
    /// </summary>
    [MenuItem("VTNTools/Export/Export Packages %e")]
    static void Packaging()
    {
        string PackageName = Application.productName;
        string Version = Application.version;
        string ProjectPath = Application.dataPath.Replace("/Assets", "/ExportPackage");
        string fileName = string.Format("{0}/{1}_{2}.unitypackage", ProjectPath, PackageName, Version);

        Directory.CreateDirectory(ProjectPath);

        AssetDatabase.ExportPackage(PackTargets, fileName, ExportPackageOptions.Recurse);

        Debug.Log("Export:" + fileName);
    }


    const string targetPath = "Assets/Scripts/BaseSystem/Dynamic";
    const string source = @"
public class BuildState
{
    const string _hash = ""<Hash>"";
    const string _project = ""<Project>"";
    public const string Version = ""<Version>"";

    public static string BuildHash
    {
        get
        {
#if UNITY_EDITOR
            return ""UNITY_EDITOR"";
#else
            return _hash;
#endif
        }
    }
};";

    static public void BuildStateBuild(string project, string version)
    {
        Directory.CreateDirectory(targetPath);

        //���I����
        using (FileStream fs = new FileStream(targetPath + "/BuildState.cs", FileMode.Create, FileAccess.Write, FileShare.ReadWrite))
        {
            string sourceCode = source;
            sourceCode = sourceCode.Replace("<Hash>", Guid.NewGuid().ToString()); //�r���h�n�b�V����V�K��������
            sourceCode = sourceCode.Replace("<Project>", project); //���C�u�����o�[�W����
            sourceCode = sourceCode.Replace("<Version>", version); //���C�u�����o�[�W����
            byte[] bytes = Encoding.UTF8.GetBytes(sourceCode);
            fs.Write(bytes, 0, bytes.Length);
        }
    }
}