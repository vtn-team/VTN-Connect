
using System;

/// <summary>
/// �Q�[�����Ŏg�p����u���v���n�����
/// </summary>
[Serializable]
public class GameInfo
{
    //tbd
    int DataId;
}

/// <summary>
/// ���[�U���
/// </summary>
[Serializable]
public class UserData
{
    //Id�͖�������

    public int UserId;          //���[�UID�B����ID�����N�G�X�g���ɑ��M����
    public string UserHash;     //���[�U�n�b�V���B���炩�̃A�N�Z�X������ہA���肳��Ȃ��p�r�Ɏg�p����UUIDv4.
    public int Type;            //���j�[�N���[�U����ʃ��[�U��
    public string Name;         //���O�B�t���l�[��
    public int Level;           //���x���B1�`
    public int Gold;            //�����S�[���h�B�A�E�g�Q�[���̂ݎQ�Ƃ���z��B
    public int PlayCount;       //�v���C��
    public DateTime CreatedAt;      //��������
    public DateTime LastPlayedAt;   //�Ō�ɗV�񂾓�
    public string DisplayName;  //�\����(�Z�k�����t���l�[��)
    public int AvatarType;      //������(�A�o�^�[ID)
    public string Gender;       //����
    public int Age;             //�N��
    public string Job;          //�E��
    public string Personality;  //��
    public string Motivation;   //�`���̃��`�x
    public string Weaknesses;   //��_
    public string Background;   //�o�b�N�X�g�[���[
};


/// <summary>
/// AI�Q�[�����U���g�p
/// </summary>
public class UserDataResultSave
{
    public int UserId;
    public bool GameResult;
    public bool MissionClear;
    //note: �A�C�e���Ȃǂ̓C�x���g�ő���
}