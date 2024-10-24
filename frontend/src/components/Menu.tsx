import React, { useState } from 'react';
import { toast } from 'react-toastify';
import TwoFactorModal from './TwoFactorModal';

const Menu: React.FC = () => {
  const dishes = [
    { name: 'Pizza', image: 'https://static.vecteezy.com/system/resources/thumbnails/045/383/391/small/a-cheesy-delicious-pizza-with-tasty-pepperoni-on-a-transparent-background-png.png', id: 'pizza' },
    { name: 'Hamburger', image: 'https://png.pngtree.com/png-clipart/20231005/original/pngtree-burger-gourmet-grilled-delicious-fastfood-transparent-background-png-image_13279171.png', id: 'hamburger' },
    { name: 'Sushi', image: 'https://static.vecteezy.com/system/resources/previews/025/067/612/non_2x/sushi-with-ai-generated-free-png.png', id: 'sushi' },
  ];

  const userId = localStorage.getItem('id_user');
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (userId === null) window.location.href = '/entrar';

  const handleBuy = async (dishId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chooseDish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId, dish: dishId }),
      });

      if (!response.ok) {
        throw new Error('Failed to choose dish');
      }

      const data = await response.json();
      toast.success('Prato escolhido com sucesso!');
      console.log("chooseDish", data);
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Erro ao escolher o prato!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center">Menu</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dishes.map((dish) => (
          <div key={dish.id} className="bg-white p-4 rounded shadow-md">
            <img src={dish.image} alt={dish.name} className="w-full h-48 object-cover mb-4" />
            <h3 className="text-xl font-bold mb-2">{dish.name}</h3>
            <button
              onClick={() => handleBuy(dish.id)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Comprar
            </button>
          </div>
        ))}
      </div>
      <TwoFactorModal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} userId={userId} />
    </div>
  );
};

export default Menu;
