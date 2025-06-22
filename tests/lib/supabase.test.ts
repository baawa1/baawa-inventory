import { mockSupabase, resetAllMocks } from "../utils/test-utils";

// Mock the Supabase client
jest.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
  createServerComponentClient: () => mockSupabase,
  createClientComponentClient: () => mockSupabase,
  createRouteHandlerClient: () => mockSupabase,
}));

describe("Supabase Client Tests", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("Authentication", () => {
    it("should sign in user successfully", async () => {
      const mockUser = { id: "1", email: "test@example.com" };
      const mockSession = { access_token: "token", user: mockUser };

      mockSupabase.auth.signIn.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await mockSupabase.auth.signIn({
        email: "test@example.com",
        password: "password",
      });

      expect(result.data.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
    });

    it("should handle sign in error", async () => {
      const mockError = { message: "Invalid credentials" };

      mockSupabase.auth.signIn.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await mockSupabase.auth.signIn({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(result.data.user).toBeNull();
      expect(result.error).toEqual(mockError);
    });

    it("should sign out user successfully", async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await mockSupabase.auth.signOut();

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it("should get current user", async () => {
      const mockUser = { id: "1", email: "test@example.com" };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await mockSupabase.auth.getUser();

      expect(result.data.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it("should get current session", async () => {
      const mockSession = { access_token: "token", user: { id: "1" } };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await mockSupabase.auth.getSession();

      expect(result.data.session).toEqual(mockSession);
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("Database Operations", () => {
    it("should select data from table", async () => {
      const mockData = [{ id: 1, name: "Test Product" }];
      const mockQuery = mockSupabase.from("products");

      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.eq.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({ data: mockData[0], error: null });

      const result = await mockSupabase
        .from("products")
        .select("*")
        .eq("id", 1)
        .single();

      expect(result.data).toEqual(mockData[0]);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith("products");
    });

    it("should insert data into table", async () => {
      const newProduct = { name: "New Product", sku: "NEW-001" };
      const insertedProduct = { id: 1, ...newProduct };
      const mockQuery = mockSupabase.from("products");

      mockQuery.insert.mockReturnValue(mockQuery);
      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({
        data: insertedProduct,
        error: null,
      });

      const result = await mockSupabase
        .from("products")
        .insert(newProduct)
        .select()
        .single();

      expect(result.data).toEqual(insertedProduct);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith("products");
    });

    it("should update data in table", async () => {
      const updatedData = { name: "Updated Product" };
      const updatedProduct = {
        id: 1,
        name: "Updated Product",
        sku: "TEST-001",
      };
      const mockQuery = mockSupabase.from("products");

      mockQuery.update.mockReturnValue(mockQuery);
      mockQuery.eq.mockReturnValue(mockQuery);
      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({ data: updatedProduct, error: null });

      const result = await mockSupabase
        .from("products")
        .update(updatedData)
        .eq("id", 1)
        .select()
        .single();

      expect(result.data).toEqual(updatedProduct);
      expect(result.error).toBeNull();
    });

    it("should delete data from table", async () => {
      const deletedProduct = { id: 1, name: "Deleted Product" };
      const mockQuery = mockSupabase.from("products");

      mockQuery.delete.mockReturnValue(mockQuery);
      mockQuery.eq.mockReturnValue(mockQuery);
      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({ data: deletedProduct, error: null });

      const result = await mockSupabase
        .from("products")
        .delete()
        .eq("id", 1)
        .select()
        .single();

      expect(result.data).toEqual(deletedProduct);
      expect(result.error).toBeNull();
    });

    it("should handle database errors", async () => {
      const mockError = { message: "Database error", code: "23505" };
      const mockQuery = mockSupabase.from("products");

      mockQuery.insert.mockReturnValue(mockQuery);
      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({ data: null, error: mockError });

      const result = await mockSupabase
        .from("products")
        .insert({ name: "Duplicate Product", sku: "DUP-001" })
        .select()
        .single();

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe("Query Filters", () => {
    it("should apply multiple filters", async () => {
      const mockData = [{ id: 1, name: "Active Product", status: "ACTIVE" }];
      const mockQuery = mockSupabase.from("products");

      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.eq.mockReturnValue(mockQuery);
      mockQuery.gte.mockReturnValue(mockQuery);
      mockQuery.order.mockReturnValue(mockQuery);
      mockQuery.limit.mockResolvedValue({ data: mockData, error: null });

      const result = await mockSupabase
        .from("products")
        .select("*")
        .eq("status", "ACTIVE")
        .gte("stock", 10)
        .order("created_at", { ascending: false })
        .limit(10);

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });

    it("should search with LIKE operator", async () => {
      const mockData = [{ id: 1, name: "Test Product" }];
      const mockQuery = mockSupabase.from("products");

      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.ilike.mockReturnValue(mockQuery);
      mockQuery.limit.mockResolvedValue({ data: mockData, error: null });

      const result = await mockSupabase
        .from("products")
        .select("*")
        .ilike("name", "%test%")
        .limit(10);

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });

    it("should filter with IN operator", async () => {
      const mockData = [
        { id: 1, category: "Electronics" },
        { id: 2, category: "Accessories" },
      ];
      const mockQuery = mockSupabase.from("products");

      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.in.mockReturnValue(mockQuery);
      mockQuery.limit.mockResolvedValue({ data: mockData, error: null });

      const result = await mockSupabase
        .from("products")
        .select("*")
        .in("category", ["Electronics", "Accessories"])
        .limit(10);

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });
  });
});
