import { useState, useEffect, createContext } from "react";
import { supabase } from "../utils/supabase";

export const CartContext = createContext({
  // Context to manage the products state
  products: [],
  loading: false,
  error: null,
  // Context to manage the cart state
  cart: [],
  addToCart: () => {},
  updateQtyCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  // Context to manage user session
  session: null,
  sessionLoading: false,
  sessionMessage: null,
  sessionError: null,
  handleSignUp: () => {},
  handleSignIn: () => {},
  handleSignOut: () => {},
});

export function CartProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProductsSupabase() {
      const { data, error } = await supabase.from("products").select();
      if (error) {
        setError(`Fetching products failed! ${error.message}`);
      } else {
        setProducts(data);
      }
      setLoading(false);
    }
    fetchProductsSupabase();
    // State to manage products API
    // var category = "smartphones";
    // var limit = 10;
    // var apiUrl = `https://dummyjson.com/products/category/${category}?limit=${limit}&select=id,thumbnail,title,price,description`;

    // async function fetchProducts() {
    //   try {
    //     const response = await fetch(apiUrl);
    //     const data = await response.json();
    //     setProducts(data.products);
    //   } catch (error) {
    //     setError(error);
    //   } finally {
    //     setLoading(false);
    //   }
    // }
    // fetchProducts();
  }, []);

  // State to manage the cart (restore from localStorage if available)
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem("cart");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (e) {
      // ignore write errors (e.g., storage quota)
    }
  }, [cart]);

  function addToCart(product) {
    // Check if the product is already in the cart
    const existingProduct = cart.find((item) => item.id === product.id);
    if (existingProduct) {
      updateQtyCart(product.id, existingProduct.quantity + 1);
    } else {
      setCart((prevCart) => [...prevCart, { ...product, quantity: 1 }]);
    }
  }

  function removeFromCart(productId) {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }

  function updateQtyCart(productId, quantity) {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: quantity } : item
      )
    );
  }

  function clearCart() {
    setCart([]);
  }

  // User Session Management
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionMessage, setSessionMessage] = useState(null);
  const [sessionError, setSessionError] = useState(null);

  // Restore session on mount and subscribe to auth changes
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data?.session) {
          setSession(data.session);
          // load profile for this user
          try {
            const userId = data.session.user.id;
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .single();
            if (!profileError && profileData) {
              setUserProfile(profileData);
              setIsAdmin(!!profileData.admin);
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        // ignore
      }
    }

    restoreSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, sessionData) => {
      setSession(sessionData ?? null);
      // when auth state changes, fetch profile for new user or clear
      (async () => {
        const userId = sessionData?.user?.id;
        if (!userId) {
          setUserProfile(null);
          setIsAdmin(false);
          return;
        }
        try {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
          if (!profileError && profileData) {
            setUserProfile(profileData);
            setIsAdmin(!!profileData.admin);
          }
        } catch (e) {
          // ignore
        }
      })();
    });

    return () => {
      mounted = false;
      try {
        authListener?.subscription?.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  async function handleSignUp(email, password, username) {
    setSessionLoading(true);
    setSessionMessage(null);
    setSessionError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            admin: false,
          },
          emailRedirectTo: `${window.location.origin}/signin`,
        },
      });

      if (error) throw error;

      if (data.user) {
        setSessionMessage(
          "Registration successful! Check your email to confirm your account."
        );

        // Optionally create a profile row in a `profiles` table to keep user data
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: email,
            username: username,
            admin: false,
          });
        } catch (e) {
          // ignore profile creation errors
        }

        window.location.href = "/signin";
      }
    } catch (error) {
      setSessionError(error.message);
    } finally {
      setSessionLoading(false);
    }
  }

  async function handleSignIn(email, password) {
    setSessionLoading(true);
    setSessionMessage(null);
    setSessionError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if(data.session){
        setSession(data.session);
        setSessionMessage("Sign in successful!");
        // load profile for signed in user
        try {
          const userId = data.session.user.id;
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
          if (!profileError && profileData) {
            setUserProfile(profileData);
            setIsAdmin(!!profileData.admin);
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (error) {
      setSessionError(error.message);
    } finally {
      setSessionLoading(false);
    }
  }

  async function handleSignOut() {
    setSessionLoading(true);
    setSessionMessage(null);
    setSessionError(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setSession(null);
      window.location.href = "/";
    } catch (error) {
      setSessionError(error.message);
    } finally {
      setSessionLoading(false);
    }
  }

  // ADMIN: product management helpers (require admin privileges)
  async function addProductToDB(product) {
    try {
      const { data, error } = await supabase.from("products").insert(product).select();
      if (error) throw error;
      if (data) setProducts((prev) => [...prev, ...data]);
      return data;
    } catch (err) {
      throw err;
    }
  }

  async function updateProductInDB(productId, updates) {
    try {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", productId)
        .select();
      if (error) throw error;
      if (data) setProducts((prev) => prev.map((p) => (p.id === productId ? data[0] : p)));
      return data;
    } catch (err) {
      throw err;
    }
  }

  async function deleteProductFromDB(productId) {
    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      throw err;
    }
  }

  // CART server sync: load cart from `cart` table and sync local cart to DB when logged in
  async function loadCartFromDB(userId) {
    try {
      const { data, error } = await supabase
        .from("cart")
        .select("product_id,quantity,products(*)")
        .eq("user_id", userId);
      if (error) throw error;
      if (data) {
        // Map to local cart shape (merge product fields)
        const remoteCart = data.map((row) => ({
          id: row.product_id,
          quantity: row.quantity,
          ...(row.products ?? {}),
        }));
        setCart(remoteCart);
      }
    } catch (err) {
      // ignore load errors
    }
  }

  async function syncCartToDB(userId) {
    try {
      // Replace user's cart rows with current cart
      // First delete existing rows for user
      const { error: delError } = await supabase.from("cart").delete().eq("user_id", userId);
      if (delError) throw delError;

      if (cart.length === 0) return;

      const rows = cart.map((item) => ({
        user_id: userId,
        product_id: item.id,
        quantity: item.quantity,
      }));

      const { error: insError } = await supabase.from("cart").insert(rows);
      if (insError) throw insError;
    } catch (err) {
      // ignore sync errors
    }
  }

  // When a session is established, either load remote cart or push local cart to DB
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    if (cart.length === 0) {
      // load remote cart if local is empty
      loadCartFromDB(userId);
    } else {
      // otherwise push local cart to DB (merge policy: local wins)
      syncCartToDB(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Whenever cart changes and user is logged, sync changes to DB
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    syncCartToDB(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  const context = {
    products: products,
    loading: loading,
    error: error,
    cart: cart,
    addToCart: addToCart,
    updateQtyCart: updateQtyCart,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    // Admin/product management
    addProductToDB: addProductToDB,
    updateProductInDB: updateProductInDB,
    deleteProductFromDB: deleteProductFromDB,
    // Cart DB sync helpers
    loadCartFromDB: loadCartFromDB,
    syncCartToDB: syncCartToDB,
    // Context to manage user session
    session: session,
    userProfile: userProfile,
    isAdmin: isAdmin,
    sessionLoading: sessionLoading,
    sessionMessage: sessionMessage,
    sessionError: sessionError,
    handleSignUp: handleSignUp,
    handleSignIn: handleSignIn,
    handleSignOut: handleSignOut,
  };

  return (
    <CartContext.Provider value={context}>{children}</CartContext.Provider>
  );
}
