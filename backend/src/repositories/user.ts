import { User } from "../models/user";

export const saveUser = async (user: any) => {
  await User.create(user);
};

export const getUsers = async () => {
  return await User.findAll();
};

export const getUserById = async (id: number) => {
  return await User.findByPk(id);
};

export const getUserByUsername = async (username: string) => {
  return await User.findOne({ where: { username } });
};

export const updateUser = async (id: number, updates: any) => {
  return await User.update(updates, { where: { id } });
};
